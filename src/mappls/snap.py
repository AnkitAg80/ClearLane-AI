import requests


def _chunk(seq, size):
    for i in range(0, len(seq), size):
        yield seq[i:i + size]


def snap_to_road(client, snap_url, points, batch=100):
    """Snap (lat, lng) points to roads via the Mappls movement API.

    Live-verified request contract: auth via the `access_token` QUERY param (the
    movement endpoint ignores the bearer header); points as `pts=lat,lng;lat,lng;...`;
    max 100 points per call. Returns [{"lat","lng","road_name"}]. Response field names
    are parsed defensively (the snapped-point shape could not be captured live because
    the account lacks the snapToRoad license; finalize once it is enabled).
    """
    out = []
    token = client._get_token()
    for group in _chunk(points, batch):
        pts = ";".join(f"{lat},{lng}" for lat, lng in group)
        resp = requests.get(snap_url, params={"access_token": token, "pts": pts}, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        results = data.get("results") or data.get("snappedPoints") or data.get("snapped") or []
        for r in results:
            lat = r.get("lat") if r.get("lat") is not None else r.get("latitude")
            lng = r.get("lng") if r.get("lng") is not None else r.get("longitude")
            out.append({
                "lat": lat,
                "lng": lng,
                "road_name": r.get("roadName") or r.get("road_name") or r.get("name"),
            })
    return out
