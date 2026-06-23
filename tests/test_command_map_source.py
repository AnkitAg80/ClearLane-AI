from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MAP_CANVAS = ROOT / "frontend" / "src" / "components" / "map" / "MapCanvas.tsx"
MAP_LAYERS = ROOT / "frontend" / "src" / "components" / "map" / "MapLayers.ts"
MAPPLS_BASEMAP = ROOT / "frontend" / "src" / "components" / "map" / "MapplsSdkBasemap.tsx"
CANVAS_PAGE = ROOT / "frontend" / "src" / "features" / "canvas" / "CanvasPage.tsx"
CANVAS_STORE = ROOT / "frontend" / "src" / "stores" / "useCanvasStore.ts"


def test_map_canvas_uses_street_readable_backend_configured_basemap():
    source = MAP_CANVAS.read_text(encoding="utf-8")

    assert "useConfig" in source
    assert "mapConfig?.fallback.tile_url" in source
    assert "rastertiles/voyager" in source
    assert "dark_all" not in source
    assert "react-map-gl" not in source


def test_map_canvas_threads_mappls_attribution_before_fallback_basemap():
    source = MAP_CANVAS.read_text(encoding="utf-8")

    assert "mapConfig?.provider === 'mappls'" in source
    assert "mapConfig.mappls.attribution" in source
    assert "MapplsSdkBasemap" in source
    assert "mapConfig.mappls.sdk_urls" in source
    assert "mapConfig?.fallback.attribution" in source
    assert "street-basemap" in source


def test_map_layers_render_hotspots_and_after_deployment_overlay():
    source = MAP_LAYERS.read_text(encoding="utf-8")

    assert "h3-fill" in source
    assert "h3-predicted" in source
    assert "h3-officers" in source
    assert "h3-labels" in source
    assert "remaining_next_3h_cii" in source
    assert "coalesce" in source
    assert "getElevation" not in source
    assert "elevationScale" not in source


def test_canvas_page_exposes_after_deployment_metric_toggle():
    source = CANVAS_PAGE.read_text(encoding="utf-8")

    assert "toggleLayer('predicted')" in source
    assert "toggleLayer('officers')" in source
    assert "toggleLayer('labels')" in source
    assert "After deployment: Remaining Next 3h CII" in source


def test_layer_visibility_is_type_safe_for_fill_line_symbol_circle_and_extrude():
    source = MAP_LAYERS.read_text(encoding="utf-8")

    assert "getLayerPaintOpacityProperty" in source
    assert "fill-opacity" in source
    assert "fill-extrusion-opacity" in source
    assert "line-opacity" in source
    assert "circle-opacity" in source
    assert "text-opacity" in source
    assert "Cannot read properties of undefined" not in source


def test_mappls_sdk_basemap_uses_backend_sdk_urls_without_secret_names():
    source = MAPPLS_BASEMAP.read_text(encoding="utf-8")

    assert "sdkUrls" in source
    assert "mappls.Map" in source
    assert "clearlane:map-view" in source
    assert "MAPPLS_CLIENT_SECRET" not in source


def test_map_canvas_keeps_readable_fallback_when_mappls_sdk_is_unavailable():
    source = MAP_CANVAS.read_text(encoding="utf-8")

    assert "MAPPLS_SDK_DIMMED_OPACITY" in source
    assert "mapplsEnabled && !mapConfig.mappls.tile_url ? 0 : 1" not in source


def test_canvas_store_deep_merges_persisted_layers_with_new_defaults():
    source = CANVAS_STORE.read_text(encoding="utf-8")

    assert "merge:" in source
    assert "...current.layers" in source
    assert "...persistedState.layers" in source
    assert "officers: true" in source
    assert "labels: true" in source
