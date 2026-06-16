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
