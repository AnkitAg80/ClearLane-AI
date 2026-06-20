import pandas as pd

from src.roadctx import get_graph, cell_road_context


def _osm_road_context(cells, cfg):
    """Phase-1 OSM fallback: nearest-edge road class + lanes per cell."""
    cache_path = cfg["data"]["cache_dir"] + "/bengaluru_drive.graphml"
    G = get_graph(cfg["geo"]["bbox"], cfg["roadctx"]["network_type"], cache_path)
    out = cell_road_context(cells, G, cfg["roadctx"]["lanes_default_by_class"])
    out["road_context_source"] = "osm"
    return out


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
    source = "mappls" if len(snapped) == len(cells) else "mappls_partial"
    rows = []
    for i, cell in enumerate(cells):
        snap = snapped[i] if i < len(snapped) else {}
        rows.append({
            "h3": cell,
            "road_name": snap.get("road_name"),
            "lanes": 1,
            "road_context_source": source,
        })
    return pd.DataFrame(rows)


def road_context_for_cells(cells, cfg, client=None):
    """Return OSM road context; Mappls is removed from active scoring."""
    return _osm_road_context(cells, cfg)
