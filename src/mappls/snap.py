def _chunk(seq, size):
    for i in range(0, len(seq), size):
        yield seq[i:i + size]


def snap_to_road(client, snap_url, points, batch=100):
    """Snap (lat, lng) points to roads in batches of <=100; return snapped point dicts.

    Each item: {"lat","lng","road_name"}. Response shape assumed
    `{"results":[{"lat","lng","roadName"}]}` — confirm against Task-3 capture.
    """
    out = []
    for group in _chunk(points, batch):
        path = "|".join(f"{lat},{lng}" for lat, lng in group)
        data = client.get_json(snap_url, {"path": path})
        for r in data.get("results", []):
            out.append({
                "lat": r.get("lat"),
                "lng": r.get("lng"),
                "road_name": r.get("roadName"),
            })
    return out
