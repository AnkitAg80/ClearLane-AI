from pathlib import Path


APP = Path("app/app.py")
API = Path("frontend/src/api.js")
FRONTEND_APP = Path("frontend/src/App.jsx")


def test_backend_exposes_mappls_frontend_config_without_rest_secret_names():
    source = APP.read_text(encoding="utf-8")

    assert "/api/config" in source
    assert "MAPPLS_MAP_SDK_KEY" in source
    assert "sdk_url" in source
    assert "sdk_urls" in source
    assert "MAPPLS_CLIENT_SECRET" not in source


def test_frontend_loads_config_and_passes_it_to_command_map():
    api_source = API.read_text(encoding="utf-8")
    app_source = FRONTEND_APP.read_text(encoding="utf-8")

    assert "getConfig" in api_source
    assert "request('/api/config')" in api_source
    assert "appConfig" in app_source
    assert "mapConfig={appConfig}" in app_source
