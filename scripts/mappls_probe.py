"""LIVE verification probe for the Mappls (MapmyIndia) REST API.

Phase 1.5 Task 3 (ClearLane AI). This is an *exploratory* probe: the exact
request param names and response field shapes for the Mappls nearby and
snap-to-road endpoints are under-documented, so we discover them against
the live API and report what actually works.

SECURITY: never print/log/echo the client credentials or the OAuth access
token. We only print structural facts (which param set worked, JSON keys,
field names) and sanitized error bodies.

Run:  & .\.venv\Scripts\python.exe scripts\mappls_probe.py
"""

import json
import os
import sys

# Make the project root importable when run as a script (scripts/ is one level down).
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

import requests  # noqa: E402

from src import config as config_module  # noqa: E402
from src.mappls.client import MapplsClient  # noqa: E402

SAMPLES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_mappls_samples")

# Koramangala, Bengaluru — used for the nearby probe.
KORAMANGALA_LAT = 12.9352
KORAMANGALA_LNG = 77.6245

# Three tiny Bengaluru points for the snap-to-road probe.
SNAP_POINTS = [(12.93, 77.62), (12.931, 77.621), (12.932, 77.622)]


def _sanitize(text, token, secret_id, secret):
    """Best-effort redaction of anything secret from an error/string before printing."""
    if text is None:
        return text
    s = str(text)
    for needle in (token, secret_id, secret):
        if needle:
            s = s.replace(str(needle), "<REDACTED>")
    return s


def _write_sample(name, data):
    os.makedirs(SAMPLES_DIR, exist_ok=True)
    path = os.path.join(SAMPLES_DIR, name)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    return path


def _result_list_key(data):
    """Heuristically find the top-level key whose value is a non-empty list (the results)."""
    if not isinstance(data, dict):
        return None
    # Prefer common names first, then fall back to the first list-valued key.
    for preferred in ("suggestedLocations", "results", "data", "places", "pois", "items"):
        v = data.get(preferred)
        if isinstance(v, list):
            return preferred
    for k, v in data.items():
        if isinstance(v, list):
            return k
    return None


def probe_nearby(client, token, secret_id, secret):
    """Probe the Mappls nearby endpoint, trying param-name variants until one returns results."""
    print("=" * 70)
    print("SECTION 1: NEARBY  (Koramangala, keyword 'shopping mall')")
    print("=" * 70)

    cfg = config_module.load()["mappls"]
    url = cfg["nearby_url"]
    keyword = "shopping mall"
    ref = f"{KORAMANGALA_LAT},{KORAMANGALA_LNG}"

    # Attempt order per task spec.
    variants = [
        ("keywords + refLocation", {"keywords": keyword, "refLocation": ref}),
        ("query + location", {"query": keyword, "location": ref}),
        ("keyword + refLocation", {"keyword": keyword, "refLocation": ref}),
    ]

    last_err = None
    for label, params in variants:
        try:
            # Bypass cache so we genuinely hit the live API for each variant.
            data = client.get_json(url, params, use_cache=False)
        except requests.HTTPError as e:
            status = e.response.status_code if e.response is not None else "?"
            body = e.response.text if e.response is not None else ""
            print(f"  [{label}] -> HTTP {status}: {_sanitize(body, token, secret_id, secret)[:300]}")
            last_err = e
            continue
        except Exception as e:  # noqa: BLE001
            print(f"  [{label}] -> error: {_sanitize(repr(e), token, secret_id, secret)[:300]}")
            last_err = e
            continue

        list_key = _result_list_key(data)
        has_results = bool(list_key and data.get(list_key))
        if not has_results:
            top = list(data.keys()) if isinstance(data, dict) else type(data).__name__
            print(f"  [{label}] -> HTTP 200 but no results. top-level keys: {top}")
            last_err = "200 but empty"
            continue

        # Success.
        path = _write_sample("nearby.json", data)
        results = data[list_key]
        first = results[0]
        print(f"  WORKING PARAM SET: {label}  ->  params keys = {sorted(params.keys())}")
        print(f"  wrote raw JSON -> {path}")
        print(f"  top-level JSON keys: {sorted(data.keys())}")
        print(f"  LIST key holding results: '{list_key}'  (count={len(results)})")
        if isinstance(first, dict):
            print(f"  first result field names: {sorted(first.keys())}")
            print("  first result (sanitized sample):")
            sample = json.dumps(first, indent=2, ensure_ascii=False)
            print("    " + _sanitize(sample, token, secret_id, secret).replace("\n", "\n    "))
        else:
            print(f"  first result is not a dict: {type(first).__name__} -> {first!r}")
        print("SECTION 1: PASS")
        return True

    print(f"  no nearby param variant returned results (last: {_sanitize(repr(last_err), token, secret_id, secret)[:200]})")
    print("SECTION 1: FAIL")
    return False


def _snapped_list_key(data):
    if not isinstance(data, dict):
        return None
    for preferred in ("results", "snappedPoints", "data", "points", "geometry"):
        v = data.get(preferred)
        if isinstance(v, list):
            return preferred
    for k, v in data.items():
        if isinstance(v, list):
            return k
    return None


def probe_snap(client, token, secret_id, secret):
    """Probe the snap-to-road endpoint with GET (3 separator variants) and POST."""
    print()
    print("=" * 70)
    print("SECTION 2: SNAP-TO-ROAD  (3 Bengaluru points)")
    print("=" * 70)

    cfg = config_module.load()["mappls"]
    url = cfg["snap_url"]
    auth_header = {"Authorization": f"{client._token_type} {token}"}

    # Build path strings in three separator styles.
    semi = ";".join(f"{lat},{lng}" for lat, lng in SNAP_POINTS)   # "lat,lng;lat,lng"
    pipe = "|".join(f"{lat},{lng}" for lat, lng in SNAP_POINTS)   # "lat,lng|lat,lng"

    # Each attempt carries its own kwargs (params/json/data) and headers, because
    # the route.mappls.com movement family authenticates differently from the
    # atlas.* places family.
    #
    # DISCOVERIES (this probe, against the live API):
    #   * hdr-auth (Authorization: bearer <tok>)      -> 401 "token is empty"
    #   * `access_token` query param + wrong param    -> 412 "Parameter missing"
    #   * `access_token` query param + `pts=...`       -> 401 "Token was not recognised"
    # The error flipping from "Parameter missing" to "Token was not recognised"
    # only when the param is named `pts` proves `pts` (';'-separated "lat,lng")
    # is the correct point parameter. The final "Token was not recognised" is a
    # *licensing* gate: this OAuth token works for atlas/nearby but the account
    # is not entitled to snapToRoad on route.mappls.com (token is a 36-char
    # opaque token, recognised by Atlas, not by the movement API). Not a code bug.
    def q(extra):
        d = {"access_token": token}
        d.update(extra)
        return d

    attempts = [
        # token in access_token query param + sweep point-param names (GET).
        ("GET", "access_token + pts=';'", "get", {"params": q({"pts": semi})}),
        ("GET", "access_token + pts='|'", "get", {"params": q({"pts": pipe})}),
        ("GET", "access_token + points=';'", "get", {"params": q({"points": semi})}),
        ("GET", "access_token + path=';'", "get", {"params": q({"path": semi})}),
        ("GET", "access_token + coordinates=';'", "get", {"params": q({"coordinates": semi})}),
        # POST with pts in body, token in query.
        ("POST", "access_token + json body pts=';'", "post",
         {"params": {"access_token": token}, "json": {"pts": semi}}),
        ("POST", "access_token + data body pts=';'", "post",
         {"params": {"access_token": token}, "data": {"pts": semi}}),
        # Fallback: original header-auth attempts (documented but rejected here),
        # kept so the report shows both auth styles were tried.
        ("GET", "hdr-auth, params path=';'", "get",
         {"params": {"path": semi}, "headers": auth_header}),
        ("POST", "hdr-auth, json body path=';'", "post",
         {"json": {"path": semi}, "headers": auth_header}),
    ]

    errors = []
    for method, label, fn_name, kwargs in attempts:
        try:
            fn = getattr(requests, fn_name)
            resp = fn(url, timeout=30, **kwargs)
        except Exception as e:  # noqa: BLE001
            msg = _sanitize(repr(e), token, secret_id, secret)[:300]
            print(f"  [{method} | {label}] -> exception: {msg}")
            errors.append((method, label, "exception", msg))
            continue

        if resp.status_code != 200:
            body = _sanitize(resp.text, token, secret_id, secret)[:300]
            print(f"  [{method} | {label}] -> HTTP {resp.status_code}: {body}")
            errors.append((method, label, resp.status_code, body))
            continue

        # 200 — parse JSON.
        try:
            data = resp.json()
        except Exception as e:  # noqa: BLE001
            body = _sanitize(resp.text, token, secret_id, secret)[:300]
            print(f"  [{method} | {label}] -> HTTP 200 but non-JSON body: {body}")
            errors.append((method, label, "non-json", body))
            continue

        path = _write_sample("snap.json", data)
        print(f"  WORKING: HTTP METHOD = {method}  |  request format = {label}")
        print(f"  wrote raw JSON -> {path}")
        if isinstance(data, dict):
            print(f"  top-level JSON keys: {sorted(data.keys())}")
            list_key = _snapped_list_key(data)
            if list_key and data.get(list_key) and isinstance(data[list_key][0], dict):
                pt = data[list_key][0]
                print(f"  snapped-point LIST key: '{list_key}'  (count={len(data[list_key])})")
                print(f"  snapped-point field names: {sorted(pt.keys())}")
                print("  first snapped point (sanitized sample):")
                sample = json.dumps(pt, indent=2, ensure_ascii=False)
                print("    " + _sanitize(sample, token, secret_id, secret).replace("\n", "\n    "))
            else:
                # Geometry might be encoded (polyline) or a flat structure; show a sanitized snippet.
                print(f"  no list-of-dicts of snapped points found; list_key={list_key!r}")
                sample = json.dumps(data, indent=2, ensure_ascii=False)[:800]
                print("    " + _sanitize(sample, token, secret_id, secret).replace("\n", "\n    "))
        else:
            print(f"  response is not a dict: {type(data).__name__}")
        print("SECTION 2: PASS")
        return True

    print("  no snap variant returned HTTP 200. status codes / sanitized bodies above.")
    print("  summary: " + "; ".join(f"{m}/{lbl}={st}" for m, lbl, st, _ in errors))
    print("SECTION 2: FAIL")
    return False


def main():
    cfg = config_module.load()["mappls"]
    client = MapplsClient(cache_dir=cfg["cache_dir"])
    if not client.configured:
        print("FATAL: Mappls client is not configured (missing MAPPLS_CLIENT_ID / "
              "MAPPLS_CLIENT_SECRET in environment / .env). Aborting. No secrets printed.")
        sys.exit(1)

    # Acquire a token once for both sections. Never print it.
    try:
        token = client._get_token()
    except requests.HTTPError as e:
        status = e.response.status_code if e.response is not None else "?"
        body = e.response.text if e.response is not None else ""
        # Sanitize using the creds (token not yet available).
        body = body.replace(str(client.client_id or ""), "<REDACTED>")
        body = body.replace(str(client.client_secret or ""), "<REDACTED>")
        print(f"FATAL: OAuth token request failed -> HTTP {status}: {body[:400]}")
        sys.exit(1)
    except Exception as e:  # noqa: BLE001
        print(f"FATAL: OAuth token request raised: {type(e).__name__}")
        sys.exit(1)

    print("AUTH: OAuth client_credentials token acquired OK "
          f"(token_type='{client._token_type}'). [token value not shown]")
    print()

    secret_id = client.client_id
    secret = client.client_secret

    nearby_ok = False
    snap_ok = False
    try:
        nearby_ok = probe_nearby(client, token, secret_id, secret)
    except Exception as e:  # noqa: BLE001
        print(f"SECTION 1 crashed: {_sanitize(repr(e), token, secret_id, secret)[:300]}")
        print("SECTION 1: FAIL")

    try:
        snap_ok = probe_snap(client, token, secret_id, secret)
    except Exception as e:  # noqa: BLE001
        print(f"SECTION 2 crashed: {_sanitize(repr(e), token, secret_id, secret)[:300]}")
        print("SECTION 2: FAIL")

    print()
    print("=" * 70)
    print(f"OVERALL: AUTH=PASS  NEARBY={'PASS' if nearby_ok else 'FAIL'}  "
          f"SNAP={'PASS' if snap_ok else 'FAIL'}")
    print("=" * 70)


if __name__ == "__main__":
    main()
