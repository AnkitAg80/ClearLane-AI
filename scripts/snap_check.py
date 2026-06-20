"""Single Snap-to-Road entitlement check (short timeout, token sanitized).

Run: & .\.venv\Scripts\python.exe scripts\snap_check.py
- STATUS 200  -> snapToRoad enabled for these creds; paste the BODY to finalize the parser.
- STATUS 401  -> token not recognised: these creds' project lacks Snap-to-Road allocation.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests

from src.mappls.client import MapplsClient
from src import config as c

cfg = c.load()
cl = MapplsClient(cache_dir=cfg["mappls"]["cache_dir"])
token = cl._get_token()
url = cfg["mappls"]["snap_url"]
pts = "12.93,77.62;12.931,77.621;12.932,77.622"
print("snap_url =", url)
try:
    r = requests.get(url, params={"access_token": token, "pts": pts}, timeout=15)
    body = r.text[:600].replace(token, "<token>")
    print("STATUS", r.status_code)
    print("BODY", body)
except Exception as e:
    print("ERROR", type(e).__name__, str(e)[:200])
