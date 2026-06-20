import h3
from src.enrich import cell_poi_context


class FakeClient:
    def get_json(self, url, params=None, use_cache=True):
        kw = params["keywords"]
        if kw == "shopping mall":
            return {"suggestedLocations": [{"placeName": "Forum", "type": kw, "distance": 100}]}
        return {"suggestedLocations": []}


def test_cell_poi_context_counts_per_keyword():
    cell = h3.latlng_to_cell(12.9352, 77.6245, 9)
    cfg = {"nearby_url": "https://atlas.test/nearby",
           "poi_keywords": ["shopping mall", "metro station"],
           "poi_radius_m": 500}
    df = cell_poi_context([cell], FakeClient(), cfg).set_index("h3")
    assert df.loc[cell, "poi_shopping_mall"] == 1
    assert df.loc[cell, "poi_metro_station"] == 0


def test_cell_poi_context_marks_partial_keyword_failures():
    class PartialClient:
        def get_json(self, url, params=None, use_cache=True):
            if params["keywords"] == "hospital":
                raise RuntimeError("quota")
            return {"suggestedLocations": [{"placeName": "X", "type": params["keywords"], "distance": 100}]}

    cell = h3.latlng_to_cell(12.9352, 77.6245, 9)
    cfg = {"nearby_url": "https://atlas.test/nearby",
           "poi_keywords": ["market", "hospital"],
           "poi_radius_m": 500}
    df = cell_poi_context([cell], PartialClient(), cfg).set_index("h3")
    assert df.loc[cell, "poi_market"] == 1
    assert df.loc[cell, "poi_hospital"] == 0
    assert df.loc[cell, "poi_enrichment_status"] == "partial"
