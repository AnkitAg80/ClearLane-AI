import os

import pytest

from src.mappls.client import MapplsClient
from src import config as config_module

pytestmark = pytest.mark.skipif(
    not os.environ.get("MAPPLS_LIVE_TEST")
    or not (os.environ.get("MAPPLS_CLIENT_ID") and os.environ.get("MAPPLS_CLIENT_SECRET")),
    reason="Set MAPPLS_LIVE_TEST=1 and MAPPLS_CLIENT_ID/SECRET",
)


def test_live_token_and_nearby(tmp_path):
    cfg = config_module.load()["mappls"]
    client = MapplsClient(cache_dir=str(tmp_path))
    # token must succeed
    assert client._get_token()
    # Verified live param shape (see scripts/mappls_probe.py discovery):
    # nearby wants `keywords` + `refLocation` ("lat,lng"); results live under
    # "suggestedLocations".
    data = client.get_json(
        cfg["nearby_url"],
        {"keywords": "shopping mall", "refLocation": "12.9352,77.6245"},
    )
    assert isinstance(data, dict)
    assert isinstance(data.get("suggestedLocations"), list)
