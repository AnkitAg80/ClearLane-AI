import argparse
import os

from src import config as config_module
from src.ingest import load_violations
from src.geo import add_h3
from src.aggregate import cell_time_counts, cell_totals, station_totals
from src.roadctx import get_graph, cell_road_context


def run(cfg, sample=None, with_roadctx=True):
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

    return {"cell_time_counts": ctc, "cell_totals": tot, "station_totals": stn}


def main():
    parser = argparse.ArgumentParser(description="Gridlock Phase-1 pipeline")
    parser.add_argument("--sample", type=int, default=None, help="limit to first N rows")
    parser.add_argument("--no-roadctx", action="store_true", help="skip OSM road context")
    args = parser.parse_args()
    cfg = config_module.load()
    run(cfg, sample=args.sample, with_roadctx=not args.no_roadctx)


if __name__ == "__main__":
    main()
