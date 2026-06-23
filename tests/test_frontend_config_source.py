from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "app" / "app.py"
ENDPOINTS = ROOT / "frontend" / "src" / "lib" / "api" / "endpoints.ts"
HOOKS = ROOT / "frontend" / "src" / "lib" / "api" / "hooks.ts"
MAP_CANVAS = ROOT / "frontend" / "src" / "components" / "map" / "MapCanvas.tsx"


def test_backend_exposes_mappls_frontend_config_without_rest_secret_names():
    source = APP.read_text(encoding="utf-8")

    assert "/api/config" in source
    assert "MAPPLS_MAP_SDK_KEY" in source
    assert "sdk_url" in source
    assert "sdk_urls" in source
    assert "style_url" in source
    assert "tile_url" in source
    assert "MAPPLS_CLIENT_SECRET" not in source


def test_frontend_loads_config_and_passes_it_to_map_canvas():
    endpoint_source = ENDPOINTS.read_text(encoding="utf-8")
    hook_source = HOOKS.read_text(encoding="utf-8")
    map_source = MAP_CANVAS.read_text(encoding="utf-8")

    assert "config:" in endpoint_source
    assert "client.get<MapConfig>('/config')" in endpoint_source
    assert "useConfig" in hook_source
    assert "useConfig" in map_source
    assert "MapplsSdkBasemap" in map_source
    assert "mapConfig?.fallback.tile_url" in map_source


def test_frontend_api_has_intelligence_helpers():
    source = ENDPOINTS.read_text(encoding="utf-8")

    assert "intelligence:" in source
    assert "timeline:" in source
    assert "missions:" in source
