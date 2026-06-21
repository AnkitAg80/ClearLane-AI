import os
import uvicorn
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src import config
from src.app_utils import (
    artifact_status,
    load_stage4_artifacts,
    prepare_map_dataframe,
    summarize_deployment,
)
from app.dashboard_service import (
    build_deployment_payload,
    build_evidence_payload,
    build_hotspot_detail,
    build_hotspot_rows,
    build_map_rows,
    build_overview_payload,
)
from pydantic import BaseModel
import copy
from src.optimize import allocate_officers, relief_from_assignments
from src.evaluate import deployment_roi


app = FastAPI(title="ClearLane AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cfg = config.load()
processed_dir = cfg["data"]["processed_dir"]

try:
    artifacts = load_stage4_artifacts(processed_dir)
    cii_df = artifacts["cii"]
    base_plan_df = artifacts["deployment"]
    roi_metrics = artifacts["roi_metrics"] or {}
    backtest_metrics = artifacts["backtest_metrics"] or {}
    model_metadata = artifacts["model_metadata"] or {}
    feature_importance = artifacts["feature_importance"]
    ranker_importance = artifacts["ranker_importance"]

    if cii_df is not None and base_plan_df is not None:
        plan_df = base_plan_df.copy()
        cii_for_map = cii_df
        if "h3" in cii_df.columns and "h3" in plan_df.columns:
            cii_for_map = cii_df[cii_df["h3"].isin(plan_df["h3"].dropna().unique())]
        map_df = prepare_map_dataframe(cii_for_map, plan_df)
        cii_timestamp_col = "bucket" if "bucket" in map_df.columns else None
        if cii_timestamp_col:
            map_df = map_df.sort_values(cii_timestamp_col).drop_duplicates("h3", keep="last")
        else:
            map_df = map_df.drop_duplicates("h3")
    else:
        map_df = pd.DataFrame()
except Exception as e:
    print(f"Error loading artifacts: {e}")
    map_df = pd.DataFrame()
    base_plan_df = pd.DataFrame()
    backtest_metrics = {}
    roi_metrics = {}
    model_metadata = {}
    feature_importance = None
    ranker_importance = None


def loaded_artifacts():
    return {
        "cii": cii_df if "cii_df" in globals() else pd.DataFrame(),
        "deployment": base_plan_df,
        "reactive": artifacts.get("reactive") if "artifacts" in globals() else pd.DataFrame(),
        "predictions": artifacts.get("predictions") if "artifacts" in globals() else pd.DataFrame(),
        "backtest_metrics": backtest_metrics,
        "roi_metrics": roi_metrics,
        "model_metadata": model_metadata,
        "feature_importance": feature_importance,
        "ranker_importance": ranker_importance,
    }


def artifact_rows():
    return artifact_status(processed_dir)


def read_env_value(name):
    value = os.environ.get(name)
    if value:
        return value.strip()
    env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
    if not os.path.exists(env_path):
        return ""
    try:
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                stripped = line.strip()
                if not stripped or stripped.startswith("#") or "=" not in stripped:
                    continue
                key, raw_value = stripped.split("=", 1)
                if key.strip() == name:
                    return raw_value.strip().strip('"').strip("'")
    except OSError:
        return ""
    return ""


def mappls_frontend_config():
    key = read_env_value("MAPPLS_MAP_SDK_KEY")
    sdk_urls = []
    if key:
        sdk_urls = [
            f"https://apis.mappls.com/advancedmaps/api/{key}/map_sdk?layer=vector&v=3.0",
            f"https://apis.mapmyindia.com/advancedmaps/v1/{key}/map_load?v=1.5",
        ]
    return {
        "provider": "mappls" if key else "carto",
        "mappls": {
            "enabled": bool(key),
            "sdk_url": sdk_urls[0] if sdk_urls else "",
            "sdk_urls": sdk_urls,
            "attribution": "Map powered by Mappls",
        },
        "fallback": {
            "provider": "carto",
            "tile_url": "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
            "attribution": "© CARTO, © OpenStreetMap contributors",
        },
    }


def clean_data_for_json(df):
    if df is None or df.empty:
        return []
    df = df.replace([np.inf, -np.inf], np.nan)
    df = df.where(pd.notnull(df), None)
    return df.to_dict(orient="records")

@app.get("/api/dashboard")
def get_dashboard_data():
    summary = {}
    if not base_plan_df.empty:
        summary = summarize_deployment(base_plan_df, roi_metrics, backtest_metrics)
    
    if not base_plan_df.empty and "expected_relief" in base_plan_df.columns:
        active_plan = base_plan_df[base_plan_df["officers_assigned"] > 0].sort_values("expected_relief", ascending=False).head(100)
    else:
        active_plan = base_plan_df.head(100) if not base_plan_df.empty else pd.DataFrame()
    
    return {
        "summary": summary,
        "map_data": clean_data_for_json(map_df),
        "deployment_plan": clean_data_for_json(active_plan),
        "metrics": {
            "backtest": backtest_metrics,
            "roi": roi_metrics,
            "model_metadata": model_metadata,
        },
        "bbox": cfg["geo"]["bbox"] if "geo" in cfg else None
    }


class OptimizeRequest(BaseModel):
    officer_budget: int

@app.post("/api/optimize")
def optimize_deployment(req: OptimizeRequest):
    global base_plan_df, roi_metrics, map_df, cii_df
    
    if base_plan_df.empty:
        raise HTTPException(status_code=400, detail="Base deployment plan not loaded.")
        
    cfg_copy = copy.deepcopy(cfg)
    cfg_copy["optimize"]["officer_budget"] = req.officer_budget
    
    # We use base_plan_df as the input forecast_df.
    score_col = cfg_copy["forecast"].get("deployment_score_column", "pred_next_3h_cii")
    if score_col not in base_plan_df.columns:
        score_col = "pred_next_3h_cii"
        
    plan = allocate_officers(base_plan_df, cfg_copy, score_col=score_col)
    plan["expected_relief"] = relief_from_assignments(plan, "forecast_cii", cfg_copy)
    
    reactive_input = base_plan_df.copy()
    if "current_violation_count" in reactive_input.columns:
        reactive_input["pred_cii"] = reactive_input["current_violation_count"]
    else:
        reactive_input["pred_cii"] = 0
    reactive_plan = allocate_officers(reactive_input, cfg_copy, score_col="pred_cii")
    reactive_plan["expected_relief"] = relief_from_assignments(reactive_plan, "forecast_cii", cfg_copy)
    
    new_roi_metrics = deployment_roi(plan, reactive_plan)
    
    # Update global state
    base_plan_df = plan
    roi_metrics = new_roi_metrics
    
    # Rebuild map_df
    if cii_df is not None and not base_plan_df.empty:
        cii_for_map = cii_df
        if "h3" in cii_df.columns and "h3" in base_plan_df.columns:
            cii_for_map = cii_df[cii_df["h3"].isin(base_plan_df["h3"].dropna().unique())]
        map_df = prepare_map_dataframe(cii_for_map, base_plan_df)
        cii_timestamp_col = "bucket" if "bucket" in map_df.columns else None
        if cii_timestamp_col:
            map_df = map_df.sort_values(cii_timestamp_col).drop_duplicates("h3", keep="last")
        else:
            map_df = map_df.drop_duplicates("h3")
            
    # Persist artifacts to disk
    try:
        import json
        plan.to_parquet(os.path.join(processed_dir, "deployment_plan.parquet"))
        reactive_plan.to_parquet(os.path.join(processed_dir, "reactive_deployment_plan.parquet"))
        with open(os.path.join(processed_dir, "roi_metrics.json"), "w", encoding="utf-8") as f:
            json.dump(roi_metrics, f, indent=2)
    except Exception as e:
        print(f"Error persisting new deployment: {e}")
        
    return {"status": "success", "officer_budget": req.officer_budget}


@app.get("/api/health")
def get_health():
    missing = artifact_rows()
    missing_count = int((~missing["exists"]).sum()) if not missing.empty else 0
    return {
        "status": "ready" if missing_count == 0 else "missing_artifacts",
        "missing_count": missing_count,
        "processed_dir": processed_dir,
    }


@app.get("/api/config")
def get_frontend_config():
    return mappls_frontend_config()


@app.get("/api/overview")
def get_overview():
    payload = build_overview_payload(loaded_artifacts(), artifact_rows())
    payload["bbox"] = cfg["geo"]["bbox"] if "geo" in cfg else None
    return payload


@app.get("/api/map")
def get_map_data(
    station: str | None = Query(default=None),
    min_support: float = Query(default=0.0, ge=0.0, le=1.0),
    query: str | None = Query(default=None),
    limit: int = Query(default=300, ge=1, le=1000),
):
    return {
        "rows": build_map_rows(
            loaded_artifacts(),
            station=station,
            min_support=min_support,
            query=query,
            limit=limit,
        ),
        "bbox": cfg["geo"]["bbox"] if "geo" in cfg else None,
    }


@app.get("/api/hotspots")
def get_hotspots(
    station: str | None = Query(default=None),
    min_support: float = Query(default=0.0, ge=0.0, le=1.0),
    query: str | None = Query(default=None),
    limit: int = Query(default=250, ge=1, le=1000),
):
    return {
        "rows": build_hotspot_rows(
            loaded_artifacts(),
            station=station,
            min_support=min_support,
            query=query,
            limit=limit,
        )
    }


@app.get("/api/hotspots/{h3_cell}")
def get_hotspot_detail(h3_cell: str):
    detail = build_hotspot_detail(loaded_artifacts(), h3_cell)
    if detail is None:
        raise HTTPException(status_code=404, detail="Hotspot not found")
    return detail


@app.get("/api/deployment")
def get_deployment():
    return build_deployment_payload(loaded_artifacts())


@app.get("/api/evidence")
def get_evidence():
    return build_evidence_payload(loaded_artifacts(), artifact_rows())


@app.get("/api/artifacts")
def get_artifacts():
    return {"rows": clean_data_for_json(artifact_rows())}


@app.get("/api/feature_importance")
def get_feature_importance():
    return {
        "regression": clean_data_for_json(feature_importance),
        "ranker": clean_data_for_json(ranker_importance)
    }

# Mount the react build if it exists
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    @app.get("/")
    def no_frontend():
        return HTMLResponse("<h1>Frontend build not found. Run 'npm run build' inside frontend/.</h1>")

if __name__ == "__main__":
    uvicorn.run("app.app:app", host="127.0.0.1", port=8501, reload=True)
