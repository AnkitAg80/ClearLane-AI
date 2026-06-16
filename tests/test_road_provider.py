import src.providers.road_context as rcprov


def test_falls_back_to_osm_when_mappls_disabled(monkeypatch):
    sentinel = object()
    monkeypatch.setattr(rcprov, "_osm_road_context", lambda cells, cfg: sentinel)
    out = rcprov.road_context_for_cells(["abc"], cfg={"mappls": {"enabled": False}}, client=None)
    assert out is sentinel


def test_uses_mappls_when_enabled_and_configured(monkeypatch):
    monkeypatch.setattr(rcprov, "_mappls_road_context", lambda cells, cfg, client: "mappls_df")

    class Cfg(dict):
        pass

    class FakeClient:
        configured = True

    out = rcprov.road_context_for_cells(
        ["abc"], cfg={"mappls": {"enabled": True}}, client=FakeClient())
    assert out == "mappls_df"
