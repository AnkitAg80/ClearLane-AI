import h3
import pandas as pd

from src.mappls.nearby import nearby_pois


def _col(keyword):
    return "poi_" + keyword.replace(" ", "_")


def cell_poi_context(cells, client, cfg):
    """Per H3 cell, count nearby POIs for each configured keyword (cell-level, cached)."""
    keywords = cfg["poi_keywords"]
    radius = cfg.get("poi_radius_m", 500)
    rows = []
    for cell in cells:
        lat, lng = h3.cell_to_latlng(cell)
        row = {"h3": cell}
        failures = 0
        for kw in keywords:
            try:
                pois = nearby_pois(client, cfg["nearby_url"], lat, lng, kw, radius_m=radius)
            except Exception:
                pois = []
                failures += 1
            row[_col(kw)] = len(pois)
        if failures == 0:
            row["poi_enrichment_status"] = "ok"
        elif failures == len(keywords):
            row["poi_enrichment_status"] = "failed"
        else:
            row["poi_enrichment_status"] = "partial"
        rows.append(row)
    return pd.DataFrame(rows)
