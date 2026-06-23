import argparse
import json
import os
import pandas as pd

from src import config as config_module
from src.ingest import load_violations
from src.geo import add_h3
from src.aggregate import cell_area_summary, cell_time_counts, cell_totals, station_totals, explode_violations
from src.roadctx import get_graph, cell_road_context
from src.cii import score_unit_impact, apply_road_impact, calculate_cii
from src.forecast import save_model_artifacts, train_lgbm, predict_lgbm, add_training_weights, train_ranker, predict_ranker, add_deployment_score
from src.optimize import allocate_officers
from src.evaluate import deployment_roi, evaluate_forecast, evaluate_by_timestamp, regression_metrics, top_k_overlap, top_k_recall, ndcg_at_k
from src.temporal_panel import build_hourly_panel, add_temporal_features, add_spatial_ring_features
from src.optimize import allocate_officers, relief_from_assignments


def _limit_training_rows(train_df, target_col, cfg):
    max_rows = cfg.get("forecast", {}).get("max_training_rows")
    neg_ratio = cfg.get("forecast", {}).get("negative_sampling_ratio", 4)

    positives = train_df[train_df[target_col] > 0]
    non_positive = train_df[train_df[target_col] <= 0]

    max_negatives = int(len(positives) * neg_ratio)
    capped_non_positive = non_positive.sample(
        n=min(max_negatives, len(non_positive)),
        random_state=42,
    ) if len(non_positive) > 0 else non_positive

    balanced = pd.concat([positives, capped_non_positive], ignore_index=True)

    if max_rows and len(balanced) > max_rows:
        balanced = balanced.sample(n=max_rows, random_state=42)

    return balanced.sort_values(["timestamp", "h3"]).reset_index(drop=True)


def _apply_road_lanes_to_panel(panel, road_df):
    """Fill panel lane values from road context without a full panel-sized merge."""
    if panel.empty or road_df is None or road_df.empty or "h3" not in road_df.columns or "lanes" not in road_df.columns:
        out = panel.copy()
        if "lanes" in out.columns:
            out["lanes"] = out["lanes"].fillna(1).clip(lower=1)
        return out

    out = panel.copy()
    road_lanes = (
        road_df[["h3", "lanes"]]
        .dropna(subset=["h3"])
        .drop_duplicates("h3")
        .set_index("h3")["lanes"]
    )
    mapped_lanes = pd.to_numeric(out["h3"].map(road_lanes), errors="coerce")
    if "lanes" in out.columns:
        existing_lanes = pd.to_numeric(out["lanes"], errors="coerce")
        out["lanes"] = existing_lanes.fillna(mapped_lanes).fillna(1).clip(lower=1)
    else:
        out["lanes"] = mapped_lanes.fillna(1).clip(lower=1)
    return out


def run(cfg, sample=None, with_roadctx=True, with_mappls=False, run_phase3=False, train_model=None):
    """Run the Phase-1 pipeline; write parquet artifacts; return key tables."""
    if train_model is None:
        train_model = not cfg.get("forecast", {}).get("prepare_only_default", False)
    df = load_violations(cfg["data"]["violations_csv"])
    if sample:
        df = df.head(sample)
    df = add_h3(df, cfg["geo"]["h3_resolution"], cfg["geo"]["bbox"])

    ctc = cell_time_counts(df)
    tot = cell_totals(df)
    stn = station_totals(df)
    area = cell_area_summary(df)

    out = cfg["data"]["processed_dir"]
    os.makedirs(out, exist_ok=True)
    ctc.to_parquet(os.path.join(out, "cell_time_counts.parquet"))
    tot.to_parquet(os.path.join(out, "cell_totals.parquet"))
    stn.to_parquet(os.path.join(out, "station_totals.parquet"))
    area.to_parquet(os.path.join(out, "cell_area_summary.parquet"))

    if with_roadctx:
        cache_path = os.path.join(cfg["data"]["cache_dir"], "bengaluru_drive.graphml")
        G = get_graph(cfg["geo"]["bbox"], cfg["roadctx"]["network_type"], cache_path)
        rc = cell_road_context(tot["h3"].tolist(), G, cfg["roadctx"]["lanes_default_by_class"])
        rc.to_parquet(os.path.join(out, "cell_road_context.parquet"))

    # CII Scoring Integration
    df_exploded = explode_violations(df)
    impact_df = score_unit_impact(df_exploded, cfg)

    # Get road context via provider if requested, else empty df
    if with_roadctx:
        road_df = pd.read_parquet(os.path.join(out, "cell_road_context.parquet"))
        road_df["road_context_source"] = "osm"
    else:
        road_df = pd.DataFrame({"h3": tot["h3"].tolist(), "lanes": 1})

    # Apply road impact weighting
    weighted_df = apply_road_impact(impact_df, road_df, cfg)

    # Calculate CII
    cii_df = calculate_cii(weighted_df, cfg)
    cii_df = cii_df.merge(area, on="h3", how="left")
    cii_df.to_parquet(os.path.join(out, "cell_cii.parquet"))

    if run_phase3:
        panel = build_hourly_panel(weighted_df, area, cfg)
        panel = add_temporal_features(panel, cfg)
        panel = add_spatial_ring_features(panel, cfg)
        panel = _apply_road_lanes_to_panel(panel, road_df)
        panel.to_parquet(os.path.join(out, "forecast_training_panel.parquet"))

        if not train_model:
            features = cfg.get("forecast", {}).get("features", [])
            missing = [f for f in features if f not in panel.columns]
            all_zero = [c for c in features if c in panel.columns and (panel[c] == 0).all()]
            prepare_meta = {
                "mode": "prepare_only",
                "panel_rows": int(len(panel)),
                "panel_columns": int(len(panel.columns)),
                "feature_count": len(features),
                "features_present": len(features) - len(missing),
                "missing_features": missing,
                "all_zero_features": all_zero,
                "cells": int(panel["h3"].nunique()),
                "timestamps": int(panel["timestamp"].nunique()),
            }
            with open(os.path.join(out, "forecast_prepare_metadata.json"), "w", encoding="utf-8") as f:
                json.dump(prepare_meta, f, indent=2)
            return {
                "cell_time_counts": ctc,
                "cell_totals": tot,
                "station_totals": stn,
                "cell_area_summary": area,
                "cell_cii": cii_df,
                "forecast_training_panel": panel,
            }

        target_col = cfg["forecast"].get("target_column", "target_next_3h_cii")
        pred_col = cfg["forecast"].get("prediction_column", "pred_next_3h_cii")
        train_end = pd.Timestamp(cfg["forecast"]["train_end_date"])
        train_end = train_end.tz_localize("UTC") if train_end.tzinfo is None else train_end
        train_df = panel[panel["timestamp"] <= train_end].copy()
        test_df = panel[panel["timestamp"] > train_end].copy()

        if len(train_df) < cfg["forecast"].get("min_training_rows", 1000) or test_df.empty:
            train_df = panel.copy()
            test_df = panel.copy()
            split_status = "fallback_full_panel"
        else:
            split_status = "temporal_holdout"

        train_df = _limit_training_rows(train_df, target_col, cfg)
        train_df = add_training_weights(train_df, cfg)
        model = train_lgbm(train_df, cfg)
        predictions = predict_lgbm(model, test_df, cfg)

        ranker = None
        if cfg["forecast"].get("ranker", {}).get("enabled", False):
            ranker = train_ranker(train_df, cfg)

        if ranker is not None:
            predictions = predict_ranker(ranker, predictions, cfg)

        predictions = add_deployment_score(predictions, cfg)
        predictions.to_parquet(os.path.join(out, "forecast_predictions.parquet"))
        save_model_artifacts(model, cfg, out, ranker=ranker)

        metrics = evaluate_forecast(predictions, target_col, pred_col, k_values=[10, 25, 50])
        metrics.update(evaluate_by_timestamp(predictions, target_col, pred_col, k=25))

        if "deployment_score" in predictions.columns:
            ds = predictions["deployment_score"]
            metrics["deployment_score_mean"] = float(ds.mean())
            metrics["deployment_score_std"] = float(ds.std())
            metrics["deployment_score_min"] = float(ds.min())
            metrics["deployment_score_max"] = float(ds.max())
            for k in [10, 25, 50]:
                metrics[f"deployment_score_top{k}_recall"] = top_k_recall(
                    predictions, target_col, "deployment_score", k=k
                )
                metrics[f"deployment_score_ndcg_at_{k}"] = ndcg_at_k(
                    predictions, target_col, "deployment_score", k=k
                )
        if "rank_score" in predictions.columns:
            rs = predictions["rank_score"]
            metrics["rank_score_mean"] = float(rs.mean())
            metrics["rank_score_std"] = float(rs.std())
            try:
                corr = predictions[[target_col, "rank_score"]].dropna().corr().iloc[0, 1]
                metrics["rank_score_target_correlation"] = float(corr)
            except Exception:
                metrics["rank_score_target_correlation"] = 0.0

        metrics["split_status"] = split_status
        metrics["target_column"] = target_col
        metrics["prediction_column"] = pred_col
        with open(os.path.join(out, "backtest_metrics.json"), "w", encoding="utf-8") as f:
            json.dump(metrics, f, indent=2)

        latest_timestamp = panel["timestamp"].max()
        latest_panel = panel[panel["timestamp"] == latest_timestamp].copy()
        deployment_input = predict_lgbm(model, latest_panel, cfg)
        if ranker is not None:
            deployment_input = predict_ranker(ranker, deployment_input, cfg)
        deployment_input = add_deployment_score(deployment_input, cfg)
        score_col = cfg["forecast"].get("deployment_score_column", pred_col)
        plan = allocate_officers(deployment_input, cfg, score_col=score_col)
        reactive_input = deployment_input.copy()
        reactive_input["pred_cii"] = reactive_input["current_violation_count"]
        reactive_plan = allocate_officers(reactive_input, cfg, score_col="pred_cii")
        reactive_plan["forecast_cii"] = deployment_input[pred_col].values
        plan["forecast_cii"] = deployment_input[pred_col].values
        plan["expected_relief"] = relief_from_assignments(plan, "forecast_cii", cfg)
        reactive_plan["expected_relief"] = relief_from_assignments(reactive_plan, "forecast_cii", cfg)
        roi_metrics = deployment_roi(plan, reactive_plan)

        plan.to_parquet(os.path.join(out, "deployment_plan.parquet"))
        reactive_plan.to_parquet(os.path.join(out, "reactive_deployment_plan.parquet"))
        with open(os.path.join(out, "roi_metrics.json"), "w", encoding="utf-8") as f:
            json.dump(roi_metrics, f, indent=2)

        return {
            "cell_time_counts": ctc,
            "cell_totals": tot,
            "station_totals": stn,
            "cell_area_summary": area,
            "cell_cii": cii_df,
            "forecast_training_panel": panel,
            "forecast_predictions": predictions,
            "deployment_plan": plan,
            "reactive_deployment_plan": reactive_plan,
        }

    return {"cell_time_counts": ctc, "cell_totals": tot, "station_totals": stn, "cell_area_summary": area, "cell_cii": cii_df}


def main():
    parser = argparse.ArgumentParser(description="ClearLane AI Phase-1 pipeline")
    parser.add_argument("--sample", type=int, default=None, help="limit to first N rows")
    parser.add_argument("--no-roadctx", action="store_true", help="skip OSM road context")
    parser.add_argument("--mappls", action="store_true", help="Mappls provider not available; flag ignored")
    parser.add_argument("--phase3", action="store_true", help="run Phase 3 Forecast and Optimize")
    parser.add_argument("--train", action="store_true", help="train models even if prepare_only_default is true")
    args = parser.parse_args()
    cfg = config_module.load()
    train_model = True if args.train else None
    run(cfg, sample=args.sample, with_roadctx=not args.no_roadctx, with_mappls=args.mappls, run_phase3=args.phase3, train_model=train_model)


if __name__ == "__main__":
    main()
