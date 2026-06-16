import argparse
import os
import pandas as pd

from src import config as config_module
from src.ingest import load_violations
from src.geo import add_h3
from src.aggregate import cell_time_counts, cell_totals, station_totals, explode_violations
from src.roadctx import get_graph, cell_road_context
from src.mappls.client import MapplsClient
from src.enrich import cell_poi_context
from src.cii import score_unit_impact, apply_road_impact, calculate_cii
from src.providers.road_context import road_context_for_cells
from src.forecast import train_lgbm, predict_lgbm
from src.optimize import allocate_officers


def run(cfg, sample=None, with_roadctx=True, with_mappls=False, run_phase3=False):
    """Run the Phase-1 pipeline; write parquet artifacts; return key tables."""
    df = load_violations(cfg["data"]["violations_csv"])
    if sample:
        df = df.head(sample)
    df = add_h3(df, cfg["geo"]["h3_resolution"], cfg["geo"]["bbox"])

    ctc = cell_time_counts(df)
    tot = cell_totals(df)
    stn = station_totals(df)

    out = cfg["data"]["processed_dir"]
    os.makedirs(out, exist_ok=True)
    ctc.to_parquet(os.path.join(out, "cell_time_counts.parquet"))
    tot.to_parquet(os.path.join(out, "cell_totals.parquet"))
    stn.to_parquet(os.path.join(out, "station_totals.parquet"))

    if with_roadctx:
        cache_path = os.path.join(cfg["data"]["cache_dir"], "bengaluru_drive.graphml")
        G = get_graph(cfg["geo"]["bbox"], cfg["roadctx"]["network_type"], cache_path)
        rc = cell_road_context(tot["h3"].tolist(), G, cfg["roadctx"]["lanes_default_by_class"])
        rc.to_parquet(os.path.join(out, "cell_road_context.parquet"))

    client = None
    if with_mappls and cfg.get("mappls", {}).get("enabled"):
        client = MapplsClient(cache_dir=cfg["mappls"]["cache_dir"])
        poi = cell_poi_context(tot["h3"].tolist(), client, cfg["mappls"])
        poi.to_parquet(os.path.join(out, "cell_poi_context.parquet"))

    # CII Scoring Integration
    df_exploded = explode_violations(df)
    impact_df = score_unit_impact(df_exploded, cfg)
    
    # Get road context via provider if requested, else empty df
    if with_roadctx or (with_mappls and cfg.get("mappls", {}).get("enabled")):
        road_df = road_context_for_cells(tot["h3"].tolist(), cfg, client)
    else:
        road_df = pd.DataFrame({"h3": tot["h3"].tolist(), "lanes": 1})
    
    # Apply road impact weighting
    weighted_df = apply_road_impact(impact_df, road_df, cfg)
    
    # Calculate CII
    cii_df = calculate_cii(weighted_df, cfg)
    cii_df.to_parquet(os.path.join(out, "cell_cii.parquet"))

    if run_phase3:
        # 1. Join features for forecasting
        features_df = cii_df.copy()
        if "lanes" not in features_df.columns:
            features_df = features_df.merge(road_df[["h3", "lanes"]], on="h3", how="left").fillna({"lanes": 1})

        if with_mappls and cfg.get("mappls", {}).get("enabled"):
            features_df = features_df.merge(poi, on="h3", how="left").fillna(0)

        # 2. Forecast
        model = train_lgbm(features_df, cfg)
        forecast_res = predict_lgbm(model, features_df, cfg)

        # 3. Optimize
        plan = allocate_officers(forecast_res, cfg)

        # 4. Save
        plan.to_parquet(os.path.join(out, "deployment_plan.parquet"))

        return {"cell_time_counts": ctc, "cell_totals": tot, "station_totals": stn, "cell_cii": cii_df, "deployment_plan": plan}

    return {"cell_time_counts": ctc, "cell_totals": tot, "station_totals": stn, "cell_cii": cii_df}


def main():
    parser = argparse.ArgumentParser(description="Gridlock Phase-1 pipeline")
    parser.add_argument("--sample", type=int, default=None, help="limit to first N rows")
    parser.add_argument("--no-roadctx", action="store_true", help="skip OSM road context")
    parser.add_argument("--mappls", action="store_true", help="run Mappls POI enrichment")
    parser.add_argument("--phase3", action="store_true", help="run Phase 3 Forecast and Optimize")
    args = parser.parse_args()
    cfg = config_module.load()
    run(cfg, sample=args.sample, with_roadctx=not args.no_roadctx, with_mappls=args.mappls, run_phase3=args.phase3)


if __name__ == "__main__":
    main()
