from src.mappls.nearby import nearby_pois


class FakeClient:
    def __init__(self, payload):
        self._p = payload
        self.last_params = None
    def get_json(self, url, params=None, use_cache=True):
        self.last_params = params
        return self._p


def test_nearby_pois_parses_and_filters_radius():
    payload = {"suggestedLocations": [
        {"placeName": "Forum Mall", "type": "SHOPPING", "distance": 120},
        {"placeName": "Far Mall", "type": "SHOPPING", "distance": 900},
    ]}
    client = FakeClient(payload)
    pois = nearby_pois(client, "https://atlas.test/nearby", 12.9, 77.6, "shopping mall", radius_m=500)
    assert len(pois) == 1                         # 900m filtered out
    assert pois[0]["name"] == "Forum Mall"
    assert pois[0]["distance_m"] == 120
    assert client.last_params["refLocation"] == "12.9,77.6"
    assert client.last_params["keywords"] == "shopping mall"
    assert "radius" not in client.last_params     # radius is NOT sent to the API


def test_nearby_pois_handles_empty():
    class C:
        def get_json(self, url, params=None, use_cache=True):
            return {}
    assert nearby_pois(C(), "https://atlas.test/nearby", 12.9, 77.6, "metro station") == []
