# Gridlock Phase 1.5 — Mappls Integration Layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Mappls (MapmyIndia, the event sponsor) enrichment layer — cell-level POI context + India-accurate road context via Snap-to-Road — on top of the existing OSM foundation, with OSM as automatic fallback, all disk-cached and credential-gated.

**Dataset-alignment correction (2026-06-18):** Mappls POI keywords are optional explanatory context only. They must not be treated as the universe of violation areas. The primary place model comes from the dataset's observed `location`, `junction_name`, coordinates, and `police_station` fields, summarized in Phase 1's `cell_area_summary.parquet`. Mappls can explain nearby context around a hotspot, but hotspot identity comes from observed violations.

**Removal correction (2026-06-18):** Mappls has been removed from the active Phase 1-2 scoring pipeline because its current road-context path forces `lanes = 1` and can distort BPR capacity scoring. The code files remain as archived/inactive probes, but `config.yaml` sets `mappls.enabled: false`, the pipeline ignores `--mappls`, and road context now uses OSM capacity data only.

**Architecture:** A thin OAuth+cache `MapplsClient` underpins small per-API modules (`nearby`, `snap`). A `road_context` provider prefers Mappls and falls back to the Phase-1 OSM module. `enrich.py` produces cell-level `cell_poi_context.parquet`. Everything is optional (no creds → OSM/heuristic fallback) and cached (quota-safe, offline-safe demo). Spec §11: `docs/superpowers/specs/2026-06-16-gridlock-congestion-prioritizer-design.md`.

**Tech Stack:** Python 3.11 `.venv`, `requests`, `python-dotenv` (new), plus existing pandas/h3/osmnx/pytest.

**Conventions:** Use the venv interpreter for every command: `& .\.venv\Scripts\python.exe ...`. Commit only the files listed per task (never `git add .`). Every commit ends with `-m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"`. Credentials live ONLY in env / gitignored `.env` — never in code or commits.

---

## File Structure (this phase)

```
.env.example                       # template (committed); real .env is gitignored
src/mappls/__init__.py
src/mappls/client.py               # MapplsClient: env creds, OAuth token, disk-cached GET
src/mappls/nearby.py               # nearby_pois(client, lat, lng, keyword, ...)
src/mappls/snap.py                 # snap_to_road(client, points)
src/providers/__init__.py
src/providers/road_context.py      # road_context_for_cells(): Mappls primary, OSM fallback
src/enrich.py                      # cell_poi_context(): per-cell POI aggregation
scripts/mappls_probe.py            # live shape-capture helper (run with real creds)
tests/test_mappls_client.py
tests/test_mappls_live.py          # skipped unless creds in env
tests/test_mappls_nearby.py
tests/test_mappls_snap.py
tests/test_road_provider.py
tests/test_enrich.py
config.yaml                        # + mappls section
requirements.txt                   # + requests, python-dotenv
```

---

### Task 1: Dependencies, config, env scaffolding

**Files:** Modify `requirements.txt`, `config.yaml`; Create `.env.example`, `src/mappls/__init__.py`, `src/providers/__init__.py`; Test `tests/test_config.py` (extend).

- [ ] **Step 1: Add deps to `requirements.txt`** (append two lines)

```text
requests>=2.31
python-dotenv>=1.0
```

- [ ] **Step 2: Install into venv**

Run: `& .\.venv\Scripts\python.exe -m pip install requests python-dotenv`
Expected: both already-present or newly installed, no errors.

- [ ] **Step 3: Append the `mappls` section to `config.yaml`**

```yaml
mappls:
  enabled: true
  cache_dir: "data/cache/mappls"
  token_url: "https://outpost.mappls.com/api/security/oauth/token"
  snap_url: "https://route.mappls.com/route/movement/snapToRoad"
  nearby_url: "https://atlas.mappls.com/api/places/nearby/json"
  poi_keywords: ["metro station", "shopping mall", "market", "hospital", "school", "bus station"]
  poi_radius_m: 500
```

- [ ] **Step 4: Create `.env.example`** (committed template; real `.env` is gitignored)

```text
MAPPLS_CLIENT_ID=your_client_id_here
MAPPLS_CLIENT_SECRET=your_client_secret_here
MAPPLS_MAP_SDK_KEY=your_map_sdk_key_here
```

- [ ] **Step 5: Add `.env` to `.gitignore`** (append one line)

```text
.env
```

- [ ] **Step 6: Create empty `src/mappls/__init__.py` and `src/providers/__init__.py`.**

- [ ] **Step 7: Extend `tests/test_config.py`** — add this test:

```python
def test_config_has_mappls_section():
    cfg = config.load()
    assert cfg["mappls"]["enabled"] in (True, False)
    assert cfg["mappls"]["token_url"].startswith("https://")
    assert "metro station" in cfg["mappls"]["poi_keywords"]
```

- [ ] **Step 8: Run and verify**

Run: `& .\.venv\Scripts\python.exe -m pytest tests/test_config.py -v`
Expected: 2 passed.

- [ ] **Step 9: Commit**

```bash
git add requirements.txt config.yaml .env.example .gitignore src/mappls/__init__.py src/providers/__init__.py tests/test_config.py
git commit -m "chore: scaffold Mappls config, env template, deps" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: MapplsClient — OAuth token + disk-cached GET

**Files:** Create `src/mappls/client.py`, `tests/test_mappls_client.py`.

The token mechanism is known and stable (POST `client_credentials` → bearer token). Response caching makes the demo offline-safe and quota-friendly.

- [ ] **Step 1: Write the failing test** `tests/test_mappls_client.py`:

```python
from src.mappls.client import MapplsClient


class FakeResp:
    def __init__(self, payload):
        self._p = payload
    def raise_for_status(self):
        pass
    def json(self):
        return self._p


def test_token_fetched_once_and_responses_disk_cached(monkeypatch, tmp_path):
    calls = {"post": 0, "get": 0}

    def fake_post(url, data=None, timeout=None):
        calls["post"] += 1
        assert data["grant_type"] == "client_credentials"
        return FakeResp({"access_token": "tok", "token_type": "bearer", "expires_in": 86400})

    def fake_get(url, params=None, headers=None, timeout=None):
        calls["get"] += 1
        assert headers["Authorization"] == "bearer tok"
        return FakeResp({"results": [1, 2]})

    monkeypatch.setattr("src.mappls.client.requests.post", fake_post)
    monkeypatch.setattr("src.mappls.client.requests.get", fake_get)

    c = MapplsClient("id", "secret", cache_dir=str(tmp_path))
    assert c.configured is True
    d1 = c.get_json("https://x.test/api", {"a": 1})
    d2 = c.get_json("https://x.test/api", {"a": 1})   # identical -> disk cache
    assert d1 == d2 == {"results": [1, 2]}
    assert calls["post"] == 1   # token fetched once
    assert calls["get"] == 1    # second call served from cache


def test_not_configured_without_creds(monkeypatch, tmp_path):
    monkeypatch.delenv("MAPPLS_CLIENT_ID", raising=False)
    monkeypatch.delenv("MAPPLS_CLIENT_SECRET", raising=False)
    c = MapplsClient(cache_dir=str(tmp_path))
    assert c.configured is False
```

- [ ] **Step 2: Run to verify it FAILS**

Run: `& .\.venv\Scripts\python.exe -m pytest tests/test_mappls_client.py -v`
Expected: `ModuleNotFoundError: No module named 'src.mappls.client'`.

- [ ] **Step 3: Write `src/mappls/client.py`**

```python
import hashlib
import json
import os
import time

import requests
from dotenv import load_dotenv

load_dotenv()  # picks up a local .env if present

DEFAULT_TOKEN_URL = "https://outpost.mappls.com/api/security/oauth/token"


class MapplsClient:
    """OAuth client_credentials token manager + disk-cached JSON GET for Mappls REST APIs."""

    def __init__(self, client_id=None, client_secret=None,
                 cache_dir="data/cache/mappls", token_url=DEFAULT_TOKEN_URL):
        self.client_id = client_id or os.environ.get("MAPPLS_CLIENT_ID")
        self.client_secret = client_secret or os.environ.get("MAPPLS_CLIENT_SECRET")
        self.cache_dir = cache_dir
        self.token_url = token_url
        self._token = None
        self._token_type = "bearer"
        self._token_expiry = 0.0
        os.makedirs(cache_dir, exist_ok=True)

    @property
    def configured(self):
        return bool(self.client_id and self.client_secret)

    def _get_token(self):
        if self._token and time.time() < self._token_expiry - 60:
            return self._token
        resp = requests.post(self.token_url, data={
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }, timeout=30)
        resp.raise_for_status()
        payload = resp.json()
        self._token = payload["access_token"]
        self._token_type = payload.get("token_type", "bearer")
        self._token_expiry = time.time() + int(payload.get("expires_in", 86400))
        return self._token

    def _cache_path(self, key):
        digest = hashlib.sha1(key.encode("utf-8")).hexdigest()
        return os.path.join(self.cache_dir, digest + ".json")

    def get_json(self, url, params=None, use_cache=True):
        """GET url with bearer auth; cache JSON responses on disk keyed by url+params."""
        cache_key = url + "?" + json.dumps(params or {}, sort_keys=True)
        path = self._cache_path(cache_key)
        if use_cache and os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        token = self._get_token()
        headers = {"Authorization": f"{self._token_type} {token}"}
        resp = requests.get(url, params=params, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f)
        return data
```

- [ ] **Step 4: Run to verify it PASSES**

Run: `& .\.venv\Scripts\python.exe -m pytest tests/test_mappls_client.py -v`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/mappls/client.py tests/test_mappls_client.py
git commit -m "feat: MapplsClient with OAuth token + disk-cached GET" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Gated live verification — capture real response shapes

**Files:** Create `scripts/mappls_probe.py`, `tests/test_mappls_live.py`.

**Purpose:** Confirm auth works with the real creds and **capture the actual JSON shapes** of nearby + snap so the parsers in Tasks 4–6 are written against reality, not guesses. These run ONLY when creds are in env (skipped in normal CI).

- [ ] **Step 1: Create `scripts/mappls_probe.py`**

```python
"""Run with real creds to dump live Mappls response shapes for parser authoring.

Usage (creds in env or .env):
    & .\.venv\Scripts\python.exe scripts\mappls_probe.py
Writes raw JSON to scripts/_mappls_samples/.
"""
import json
import os

from src.mappls.client import MapplsClient
from src import config as config_module

OUT = os.path.join("scripts", "_mappls_samples")


def main():
    cfg = config_module.load()["mappls"]
    client = MapplsClient(cache_dir=cfg["cache_dir"])
    if not client.configured:
        raise SystemExit("Set MAPPLS_CLIENT_ID / MAPPLS_CLIENT_SECRET in env or .env first.")
    os.makedirs(OUT, exist_ok=True)

    # Koramangala test point
    lat, lng = 12.9352, 77.6245
    nearby = client.get_json(cfg["nearby_url"],
                             {"keywords": "shopping mall", "refLocation": f"{lat},{lng}"})
    with open(os.path.join(OUT, "nearby.json"), "w", encoding="utf-8") as f:
        json.dump(nearby, f, indent=2)
    print("nearby keys:", list(nearby.keys()))

    print("Saved samples to", OUT)


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Create `tests/test_mappls_live.py`** (auto-skips without creds)

```python
import os
import pytest

from src.mappls.client import MapplsClient
from src import config as config_module

pytestmark = pytest.mark.skipif(
    not (os.environ.get("MAPPLS_CLIENT_ID") and os.environ.get("MAPPLS_CLIENT_SECRET")),
    reason="Mappls creds not in env",
)


def test_live_nearby_returns_payload(tmp_path):
    cfg = config_module.load()["mappls"]
    client = MapplsClient(cache_dir=str(tmp_path))
    data = client.get_json(cfg["nearby_url"],
                           {"keywords": "shopping mall", "refLocation": "12.9352,77.6245"})
    assert isinstance(data, dict)
```

- [ ] **Step 3: Run the gated test (no creds → skipped; that is expected/OK here)**

Run: `& .\.venv\Scripts\python.exe -m pytest tests/test_mappls_live.py -v`
Expected: `1 skipped` (no creds) OR `1 passed` (creds present).

- [ ] **Step 4: If creds are available, run the probe and record the real shapes**

Run (only if creds set): `& .\.venv\Scripts\python.exe scripts\mappls_probe.py`
Action: open `scripts/_mappls_samples/nearby.json`; note the actual list key (e.g. `suggestedLocations` / `results`) and POI fields (placeName, type/keywords, distance). **Use these exact keys in Tasks 4–6.** If the field names differ from the assumed ones in those tasks, adjust the parser + the mock payloads to match.

- [ ] **Step 5: Commit** (do NOT commit `scripts/_mappls_samples/` — add it to `.gitignore`)

```bash
git add scripts/mappls_probe.py tests/test_mappls_live.py .gitignore
git commit -m "feat: gated Mappls live-verify probe + skip-unless-creds test" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
(Append `scripts/_mappls_samples/` to `.gitignore` before committing.)

---

### Task 4: Nearby POI module

**Files:** Create `src/mappls/nearby.py`, `tests/test_mappls_nearby.py`.

Assumed response shape (CONFIRM against Task 3 capture; adjust keys if needed): `{"suggestedLocations": [{"placeName": ..., "type": ..., "distance": <meters>}, ...]}`.

- [ ] **Step 1: Write the failing test** `tests/test_mappls_nearby.py`:

```python
from src.mappls.nearby import nearby_pois


class FakeClient:
    def __init__(self, payload):
        self._p = payload
        self.last_params = None
    def get_json(self, url, params=None, use_cache=True):
        self.last_params = params
        return self._p


def test_nearby_pois_parses_results():
    payload = {"suggestedLocations": [
        {"placeName": "Forum Mall", "type": "shopping mall", "distance": 120},
        {"placeName": "Jyoti Market", "type": "market", "distance": 300},
    ]}
    client = FakeClient(payload)
    pois = nearby_pois(client, "https://atlas.test/nearby", 12.9, 77.6, "shopping mall", radius_m=500)
    assert len(pois) == 2
    assert pois[0]["name"] == "Forum Mall"
    assert pois[0]["distance_m"] == 120
    assert client.last_params["refLocation"] == "12.9,77.6"


def test_nearby_pois_handles_empty():
    assert nearby_pois(FakeClient({}), "https://atlas.test/nearby", 12.9, 77.6, "metro station") == []
```

- [ ] **Step 2: Run to verify it FAILS**

Run: `& .\.venv\Scripts\python.exe -m pytest tests/test_mappls_nearby.py -v`
Expected: `ModuleNotFoundError: No module named 'src.mappls.nearby'`.

- [ ] **Step 3: Write `src/mappls/nearby.py`**

```python
def nearby_pois(client, nearby_url, lat, lng, keyword, radius_m=500):
    """Return a list of nearby POIs for a keyword around (lat, lng).

    Each POI: {"name", "type", "distance_m"}. Empty list on no results.
    Response key/fields assumed `suggestedLocations[*].{placeName,type,distance}` —
    confirm against scripts/_mappls_samples/nearby.json (Task 3) and adjust if needed.
    """
    params = {
        "keywords": keyword,
        "refLocation": f"{lat},{lng}",
        "radius": radius_m,
    }
    data = client.get_json(nearby_url, params)
    results = data.get("suggestedLocations") or data.get("results") or []
    pois = []
    for r in results:
        pois.append({
            "name": r.get("placeName") or r.get("name"),
            "type": r.get("type") or keyword,
            "distance_m": r.get("distance"),
        })
    return pois
```

- [ ] **Step 4: Run to verify it PASSES**

Run: `& .\.venv\Scripts\python.exe -m pytest tests/test_mappls_nearby.py -v`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/mappls/nearby.py tests/test_mappls_nearby.py
git commit -m "feat: Mappls nearby-POI module" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Cell-level POI enrichment

**Files:** Create `src/enrich.py`, `tests/test_enrich.py`.

Produces `cell_poi_context`: per H3 cell, a count column per POI keyword (quota-safe: one batch of nearby calls per cell centroid, cached by the client).

- [ ] **Step 1: Write the failing test** `tests/test_enrich.py`:

```python
import h3
from src.enrich import cell_poi_context


class FakeClient:
    def get_json(self, url, params=None, use_cache=True):
        # one mall, no others, regardless of keyword
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
```

- [ ] **Step 2: Run to verify it FAILS**

Run: `& .\.venv\Scripts\python.exe -m pytest tests/test_enrich.py -v`
Expected: `ModuleNotFoundError: No module named 'src.enrich'`.

- [ ] **Step 3: Write `src/enrich.py`**

```python
import h3
import pandas as pd

from src.mappls.nearby import nearby_pois


def _col(keyword):
    return "poi_" + keyword.replace(" ", "_")


def cell_poi_context(cells, client, cfg):
    """Per H3 cell, count nearby POIs for each configured keyword (cell-level, cached)."""
    keywords = cfg["poi_keywords"]
    radius = cfg.get("poi_radius_m", 500)
    rows = []
    for cell in cells:
        lat, lng = h3.cell_to_latlng(cell)
        row = {"h3": cell}
        for kw in keywords:
            pois = nearby_pois(client, cfg["nearby_url"], lat, lng, kw, radius_m=radius)
            row[_col(kw)] = len(pois)
        rows.append(row)
    return pd.DataFrame(rows)
```

- [ ] **Step 4: Run to verify it PASSES**

Run: `& .\.venv\Scripts\python.exe -m pytest tests/test_enrich.py -v`
Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
git add src/enrich.py tests/test_enrich.py
git commit -m "feat: cell-level Mappls POI enrichment" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Snap-to-Road + road-context provider with OSM fallback

**Files:** Create `src/mappls/snap.py`, `src/providers/road_context.py`, `tests/test_mappls_snap.py`, `tests/test_road_provider.py`.

The provider prefers Mappls snapping; if Mappls is disabled/unconfigured/errors, it falls back to the Phase-1 OSM `cell_road_context`. Snap response shape assumed `{"results":[{"lat","lng","roadName"}...]}` — confirm/adjust per Task 3.

- [ ] **Step 1: Write the failing tests**

`tests/test_mappls_snap.py`:
```python
from src.mappls.snap import snap_to_road


class FakeClient:
    def __init__(self, payload):
        self._p = payload
        self.last_params = None
    def get_json(self, url, params=None, use_cache=True):
        self.last_params = params
        return self._p


def test_snap_to_road_parses_points():
    payload = {"results": [{"lat": 12.9, "lng": 77.6, "roadName": "80 Ft Road"}]}
    client = FakeClient(payload)
    out = snap_to_road(client, "https://route.test/snap", [(12.9, 77.6)])
    assert out[0]["road_name"] == "80 Ft Road"


def test_snap_to_road_batches_over_100(monkeypatch):
    calls = {"n": 0}

    class CountingClient:
        def get_json(self, url, params=None, use_cache=True):
            calls["n"] += 1
            return {"results": []}

    pts = [(12.9 + i * 1e-4, 77.6) for i in range(150)]
    snap_to_road(CountingClient(), "https://route.test/snap", pts)
    assert calls["n"] == 2  # 150 points -> two batches (<=100 each)
```

`tests/test_road_provider.py`:
```python
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
```

- [ ] **Step 2: Run to verify they FAIL**

Run: `& .\.venv\Scripts\python.exe -m pytest tests/test_mappls_snap.py tests/test_road_provider.py -v`
Expected: ModuleNotFoundError for `src.mappls.snap` / `src.providers.road_context`.

- [ ] **Step 3: Write `src/mappls/snap.py`**

```python
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
```

- [ ] **Step 4: Write `src/providers/road_context.py`**

```python
import pandas as pd

from src.roadctx import get_graph, cell_road_context


def _osm_road_context(cells, cfg):
    """Phase-1 OSM fallback: nearest-edge road class + lanes per cell."""
    cache_path = cfg["roadctx"]["cache_path"] if "cache_path" in cfg.get("roadctx", {}) \
        else "data/cache/bengaluru_drive.graphml"
    G = get_graph(cfg["geo"]["bbox"], cfg["roadctx"]["network_type"], cache_path)
    return cell_road_context(cells, G, cfg["roadctx"]["lanes_default_by_class"])


def _mappls_road_context(cells, cfg, client):
    """Mappls-based road context (snapped road name per cell centroid).

    Returns a DataFrame with at least `h3` and `road_name`. Lane/class enrichment
    is layered by the CII phase; OSM remains the source for lane counts where
    Mappls does not expose them.
    """
    import h3
    from src.mappls.snap import snap_to_road
    centroids = [h3.cell_to_latlng(c) for c in cells]
    snapped = snap_to_road(client, cfg["mappls"]["snap_url"], centroids)
    rows = [{"h3": c, "road_name": (s["road_name"] if i < len(snapped) else None)}
            for i, (c, s) in enumerate(zip(cells, snapped))] if snapped else \
           [{"h3": c, "road_name": None} for c in cells]
    return pd.DataFrame(rows)


def road_context_for_cells(cells, cfg, client=None):
    """Prefer Mappls road context; fall back to OSM when disabled/unconfigured/errored."""
    mappls_on = cfg.get("mappls", {}).get("enabled") and client is not None and getattr(client, "configured", False)
    if mappls_on:
        try:
            return _mappls_road_context(cells, cfg, client)
        except Exception:
            return _osm_road_context(cells, cfg)
    return _osm_road_context(cells, cfg)
```

- [ ] **Step 5: Run to verify PASSES**

Run: `& .\.venv\Scripts\python.exe -m pytest tests/test_mappls_snap.py tests/test_road_provider.py -v`
Expected: 4 passed.

- [ ] **Step 6: Commit**

```bash
git add src/mappls/snap.py src/providers/road_context.py tests/test_mappls_snap.py tests/test_road_provider.py
git commit -m "feat: Mappls snap-to-road + road-context provider with OSM fallback" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Pipeline integration

**Files:** Modify `src/pipeline.py`; Create/extend `tests/test_pipeline.py`.

Adds an optional Mappls enrichment step writing `cell_poi_context.parquet`, gated by a `--mappls` flag and `mappls.enabled`. Default behavior (no flag) is unchanged → no regression.

- [ ] **Step 1: Write the failing test** (append to `tests/test_pipeline.py`):

```python
def test_pipeline_writes_poi_context_when_mappls_enabled(tmp_path, sample_csv, monkeypatch):
    import src.pipeline as pipeline

    class FakeClient:
        configured = True
        def get_json(self, url, params=None, use_cache=True):
            return {"suggestedLocations": [{"placeName": "X", "type": params["keywords"], "distance": 50}]}

    monkeypatch.setattr(pipeline, "MapplsClient", lambda **kw: FakeClient())
    cfg = {
        "data": {"violations_csv": sample_csv,
                 "processed_dir": str(tmp_path / "processed"),
                 "cache_dir": str(tmp_path / "cache")},
        "geo": {"h3_resolution": 9,
                "bbox": {"north": 13.2, "south": 12.7, "east": 77.8, "west": 77.3}},
        "mappls": {"enabled": True, "cache_dir": str(tmp_path / "mcache"),
                   "nearby_url": "https://atlas.test/nearby",
                   "poi_keywords": ["shopping mall"], "poi_radius_m": 500},
    }
    pipeline.run(cfg, with_roadctx=False, with_mappls=True)
    import os, pandas as pd
    p = os.path.join(cfg["data"]["processed_dir"], "cell_poi_context.parquet")
    assert os.path.exists(p)
    assert "poi_shopping_mall" in pd.read_parquet(p).columns
```

- [ ] **Step 2: Run to verify it FAILS**

Run: `& .\.venv\Scripts\python.exe -m pytest tests/test_pipeline.py -v`
Expected: FAIL — `run()` has no `with_mappls` parameter / `MapplsClient` not imported.

- [ ] **Step 3: Modify `src/pipeline.py`** — add the import near the top:

```python
from src.mappls.client import MapplsClient
from src.enrich import cell_poi_context
```

and extend `run` signature and body (add the `with_mappls` param and this block after the artifacts are written, before `return`):

```python
def run(cfg, sample=None, with_roadctx=True, with_mappls=False):
    ...  # unchanged ingest/geo/aggregate + parquet writes

    if with_mappls and cfg.get("mappls", {}).get("enabled"):
        client = MapplsClient(cache_dir=cfg["mappls"]["cache_dir"])
        poi = cell_poi_context(tot["h3"].tolist(), client, cfg["mappls"])
        poi.to_parquet(os.path.join(out, "cell_poi_context.parquet"))

    return {"cell_time_counts": ctc, "cell_totals": tot, "station_totals": stn}
```

and add the CLI flag in `main()`:

```python
    parser.add_argument("--mappls", action="store_true", help="run Mappls POI enrichment")
    ...
    run(cfg, sample=args.sample, with_roadctx=not args.no_roadctx, with_mappls=args.mappls)
```

- [ ] **Step 4: Run the full suite**

Run: `& .\.venv\Scripts\python.exe -m pytest -q`
Expected: all green (Phase 1 + 1.5 tests; live test skipped without creds).

- [ ] **Step 5: Commit**

```bash
git add src/pipeline.py tests/test_pipeline.py
git commit -m "feat: optional Mappls POI enrichment in pipeline (--mappls)" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Phase 1.5 Definition of Done

- Full suite green on the 3.11 venv (live test auto-skipped without creds).
- `MapplsClient` authenticates and disk-caches; no creds anywhere in git.
- With creds in env, `scripts/mappls_probe.py` returns real JSON and the live test passes; parser field names reconciled with the capture.
- `road_context_for_cells` returns Mappls data when enabled+configured, OSM otherwise.
- `python -m src.pipeline --sample 20000 --no-roadctx --mappls` writes `cell_poi_context.parquet` (with creds; cached thereafter).
- Deferred to Phase 4 (dashboard) on the same client: live traffic overlay, Mappls basemap tiles, Distance-Matrix patrol routing.

## Final Correction 2026-06-18

This phase is superseded by `docs/superpowers/plans/2026-06-18-gridlock-winning-phases-1-to-4.md` and summarized in `readme_winning_phases_1_to_4.md`. Mappls was removed from active scoring; the final capacity path is OSM-only and the legacy `--mappls` flag is a no-op.
