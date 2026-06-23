from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
COMMAND_PALETTE = ROOT / "frontend" / "src" / "components" / "command" / "CommandPalette.tsx"
TOPBAR = ROOT / "frontend" / "src" / "components" / "layout" / "TopBar.tsx"
COMMAND_CAPSULE = ROOT / "frontend" / "src" / "components" / "layout" / "CommandCapsule.tsx"
FILTER_BAR = ROOT / "frontend" / "src" / "components" / "filters" / "FilterBar.tsx"
LOCATION_SEARCH = ROOT / "frontend" / "src" / "components" / "filters" / "LocationSearchBox.tsx"
FILTER_STORE = ROOT / "frontend" / "src" / "stores" / "useFilterStore.ts"


def test_command_palette_exposes_operator_actions_without_legacy_critical_zones_language():
    source = COMMAND_PALETTE.read_text(encoding="utf-8")

    assert "Go to Canvas" in source
    assert "Re-optimize deployment" in source
    assert "Refresh all data" in source
    assert "Critical Zones" not in source


def test_topbar_has_explicit_command_button_and_keyboard_shortcut():
    source = TOPBAR.read_text(encoding="utf-8")

    assert "Open command palette" in source
    assert "aria-keyshortcuts=\"Control+K Meta+K\"" in source
    assert "setOpen(true)" in source


def test_filterbar_uses_shared_url_backed_filters():
    source = FILTER_BAR.read_text(encoding="utf-8")

    assert "useSearchParams" in source
    assert "LocationSearchBox" in source
    assert "Police station" in source
    assert "Minimum support" in source
    assert "URLSearchParams" in source
    assert "h3" in source


def test_search_box_supports_live_suggestions_exact_h3_and_all_matches_submit():
    source = LOCATION_SEARCH.read_text(encoding="utf-8")
    store = FILTER_STORE.read_text(encoding="utf-8")

    assert "suggestions" in source
    assert "matchingSuggestions" in source
    assert "onSubmit" in source
    assert "Search all matches" in source
    assert "navigate(`/canvas?h3=" in source
    assert "setSelectedSuggestion" in store
    assert "selectedH3" in store
    assert "submitSearch" in store


def test_search_surface_is_visible_unclipped_and_submit_runs_broad_search():
    capsule = COMMAND_CAPSULE.read_text(encoding="utf-8")
    source = LOCATION_SEARCH.read_text(encoding="utf-8")

    assert "overflow-visible" in capsule
    assert "overflow-x-auto" not in capsule
    assert "bg-sig-cold" in source
    assert "text-[#03131d]" in source
    assert "<span>Search</span>" in source
    assert "setSelectedH3(null)" in source
    assert "navigate(buildCanvasHref(query))" in source
