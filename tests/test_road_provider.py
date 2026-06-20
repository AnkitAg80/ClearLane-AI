import src.providers.road_context as rcprov
import pandas as pd


def test_falls_back_to_osm_when_mappls_disabled(monkeypatch):
    sentinel = object()
    monkeypatch.setattr(rcprov, "_osm_road_context", lambda cells, cfg: sentinel)
    out = rcprov.road_context_for_cells(["abc"], cfg={"mappls": {"enabled": False}}, client=None)
    assert out is sentinel


def test_uses_osm_even_when_mappls_enabled_and_configured(monkeypatch):
    monkeypatch.setattr(rcprov, "_mappls_road_context", lambda cells, cfg, client: "mappls_df")
    monkeypatch.setattr(rcprov, "_osm_road_context", lambda cells, cfg: "osm_df")

    class Cfg(dict):
        pass

    class FakeClient:
        configured = True

    out = rcprov.road_context_for_cells(
        ["abc"], cfg={"mappls": {"enabled": True}}, client=FakeClient())
    assert out == "osm_df"


def test_mappls_road_context_preserves_all_cells_when_snap_partial(monkeypatch):
    monkeypatch.setattr("src.mappls.snap.snap_to_road",
                        lambda client, url, centroids: [{"road_name": "Only Road"}])

    cells = ["88618925c3fffff", "88618925c7fffff"]
    cfg = {"mappls": {"snap_url": "https://snap.test"}}
    out = rcprov._mappls_road_context(cells, cfg, client=object())
    assert list(out["h3"]) == cells
    assert out.loc[0, "road_name"] == "Only Road"
    assert pd.isna(out.loc[1, "road_name"])
    assert set(out["road_context_source"]) == {"mappls_partial"}
