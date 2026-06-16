import pandas as pd

from src.roadctx import get_graph, cell_road_context


def _osm_road_context(cells, cfg):
    """Phase-1 OSM fallback: nearest-edge road class + lanes per cell."""
    cache_path = cfg["data"]["cache_dir"] + "/bengaluru_drive.graphml"
    G = get_graph(cfg["geo"]["bbox"], cfg["roadctx"]["network_type"], cache_path)
    return cell_road_context(cells, G, cfg["roadctx"]["lanes_default_by_class"])


def _mappls_road_context(cells, cfg, client):
    """Mappls-based road context (snapped road name per cell centroid).

    Returns a DataFrame with at least `h3` and `road_name`. Lane/class enrichment
    is layered by the CII phase; OSM remains the source for lane counts where
    Mappls does not expose them.
    """
    import h3
    from src.mappls.snap import snap_to_road
    centroids = [h3.cell_to_latlng(c) for c in cells]
    snapped = snap_to_road(client, cfg["mappls"]["snap_url"], centroids)
    rows = [{"h3": c, "road_name": (s["road_name"] if i < len(snapped) else None), "lanes": 1}
            for i, (c, s) in enumerate(zip(cells, snapped))] if snapped else \
           [{"h3": c, "road_name": None, "lanes": 1} for c in cells]
    return pd.DataFrame(rows)


def road_context_for_cells(cells, cfg, client=None):
    """Prefer Mappls road context; fall back to OSM when disabled/unconfigured/errored."""
    mappls_on = cfg.get("mappls", {}).get("enabled") and client is not None and getattr(client, "configured", False)
    if mappls_on:
        try:
            return _mappls_road_context(cells, cfg, client)
        except Exception:
            return _osm_road_context(cells, cfg)
    return _osm_road_context(cells, cfg)
