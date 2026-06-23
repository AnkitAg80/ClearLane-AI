import h3
import networkx as nx
import src.roadctx as rc

DEFAULTS = {"primary": 2, "tertiary": 1, "_default": 1}


def test_lanes_parses_int():
    assert rc._lanes("3", "primary", DEFAULTS) == 3


def test_lanes_takes_first_of_list():
    assert rc._lanes(["2", "3"], "primary", DEFAULTS) == 2


def test_lanes_falls_back_to_class_default():
    assert rc._lanes(None, "tertiary", DEFAULTS) == 1


def test_lanes_falls_back_on_bad_value():
    assert rc._lanes("bad", "unknown", DEFAULTS) == 1


def test_cell_road_context(monkeypatch):
    G = nx.MultiDiGraph()
    G.add_node(1, x=77.700, y=12.905)
    G.add_node(2, x=77.701, y=12.906)
    G.add_edge(1, 2, key=0, highway="primary", lanes="2")
    monkeypatch.setattr(rc.ox.distance, "nearest_edges", lambda graph, X, Y: (1, 2, 0))

    cell = h3.latlng_to_cell(12.905, 77.700, 9)
    out = rc.cell_road_context([cell], G, DEFAULTS).set_index("h3")
    assert out.loc[cell, "road_class"] == "primary"
    assert out.loc[cell, "lanes"] == 2


def test_cell_road_context_batches_nearest_edge_lookup(monkeypatch):
    G = nx.MultiDiGraph()
    G.add_node(1, x=77.700, y=12.905)
    G.add_node(2, x=77.701, y=12.906)
    G.add_node(3, x=77.702, y=12.907)
    G.add_edge(1, 2, key=0, highway="primary", lanes="2")
    G.add_edge(2, 3, key=0, highway="tertiary")
    calls = []

    def fake_nearest_edges(graph, X, Y):
        calls.append((X, Y))
        assert len(X) == 2
        assert len(Y) == 2
        return [(1, 2, 0), (2, 3, 0)]

    monkeypatch.setattr(rc.ox.distance, "nearest_edges", fake_nearest_edges)

    cells = [
        h3.latlng_to_cell(12.905, 77.700, 9),
        h3.latlng_to_cell(12.907, 77.702, 9),
    ]
    out = rc.cell_road_context(cells, G, DEFAULTS).set_index("h3")

    assert len(calls) == 1
    assert out.loc[cells[0], "road_class"] == "primary"
    assert out.loc[cells[1], "road_class"] == "tertiary"
    assert out.loc[cells[1], "lanes"] == 1


def test_get_graph_calls_osmnx_with_current_bbox_signature(monkeypatch, tmp_path):
    """Guards the osmnx 2.x call signature: one bbox tuple plus keyword options."""
    captured = {}

    def fake_graph_from_bbox(*args, **kwargs):
        captured["args"] = args
        captured["kwargs"] = kwargs
        return "GRAPH"

    monkeypatch.setattr(rc.ox, "graph_from_bbox", fake_graph_from_bbox)
    monkeypatch.setattr(rc.ox, "save_graphml", lambda G, path: None)

    bbox = {"north": 13.2, "south": 12.7, "east": 77.8, "west": 77.3}
    cache = str(tmp_path / "g.graphml")  # absent -> triggers the fetch branch
    G = rc.get_graph(bbox, "drive", cache)

    assert G == "GRAPH"
    assert captured["args"] == ((77.3, 12.7, 77.8, 13.2),)  # left, bottom, right, top
    assert captured["kwargs"]["network_type"] == "drive"
