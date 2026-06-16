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
