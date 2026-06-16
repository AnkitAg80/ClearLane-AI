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
