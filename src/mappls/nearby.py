def nearby_pois(client, nearby_url, lat, lng, keyword, radius_m=500):
    """Return nearby POIs for a keyword around (lat, lng).

    Live-verified Mappls shape: results live under `suggestedLocations`, each with
    `placeName`, `type`, `distance` (metres). `radius_m` is applied client-side
    (the API is not sent a radius param). Each POI: {"name","type","distance_m"}.
    """
    params = {"keywords": keyword, "refLocation": f"{lat},{lng}"}
    data = client.get_json(nearby_url, params)
    results = data.get("suggestedLocations") or data.get("results") or []
    pois = []
    for r in results:
        dist = r.get("distance")
        if dist is not None and radius_m is not None and dist > radius_m:
            continue
        pois.append({
            "name": r.get("placeName") or r.get("name"),
            "type": r.get("type") or keyword,
            "distance_m": dist,
        })
    return pois
