import os
import h3
import osmnx as ox
import pandas as pd


def get_graph(bbox, network_type, cache_path):
    """Return the drive graph for the bbox, fetching once then reading the cache."""
    if os.path.exists(cache_path):
        return ox.load_graphml(cache_path)
    G = ox.graph_from_bbox(
        bbox["north"], bbox["south"], bbox["east"], bbox["west"],
        network_type=network_type,
    )
    os.makedirs(os.path.dirname(cache_path), exist_ok=True)
    ox.save_graphml(G, cache_path)
    return G


def _first(value):
    return value[0] if isinstance(value, list) else value


def _lanes(value, road_class, defaults):
    """Best-effort integer lane count; fall back to per-class default."""
    try:
        return int(_first(value))
    except (TypeError, ValueError):
        rc = _first(road_class)
        return defaults.get(rc, defaults["_default"])


def cell_road_context(cells, G, lane_defaults):
    """Map each H3 cell centroid to its nearest road edge's class and lane count."""
    rows = []
    for cell in cells:
        lat, lng = h3.cell_to_latlng(cell)
        u, v, k = ox.distance.nearest_edges(G, lng, lat)
        data = G.edges[u, v, k]
        road_class = _first(data.get("highway", "_default"))
        rows.append({
            "h3": cell,
            "road_class": road_class,
            "lanes": _lanes(data.get("lanes"), data.get("highway"), lane_defaults),
        })
    return pd.DataFrame(rows)
