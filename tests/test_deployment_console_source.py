from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEPLOYMENT_PAGE = ROOT / "frontend" / "src" / "features" / "deployment" / "DeploymentPage.tsx"
DEPLOYMENT_THEATRE = ROOT / "frontend" / "src" / "components" / "deployment" / "DeploymentTheatre.tsx"
OFFICER_MODAL = ROOT / "frontend" / "src" / "components" / "deployment" / "OfficerBudgetModal.tsx"
BUDGET_CONTROL = ROOT / "frontend" / "src" / "components" / "deployment" / "OfficerBudgetControl.tsx"
COMMAND_CAPSULE = ROOT / "frontend" / "src" / "components" / "layout" / "CommandCapsule.tsx"
COMMAND_PALETTE = ROOT / "frontend" / "src" / "components" / "command" / "CommandPalette.tsx"
APP = ROOT / "app" / "app.py"
API_TYPES = ROOT / "frontend" / "src" / "types" / "api.ts"


def test_deployment_page_removes_unwired_strategy_buttons():
    source = DEPLOYMENT_PAGE.read_text(encoding="utf-8")

    assert "Reactive Base</button>" not in source
    assert "Manual</button>" not in source
    assert "setMode" not in source


def test_deployment_page_uses_optimized_reactive_and_roi_language():
    source = DEPLOYMENT_PAGE.read_text(encoding="utf-8") + DEPLOYMENT_THEATRE.read_text(encoding="utf-8")

    assert "Optimized Officers" in source
    assert "Reactive Officers" in source
    assert "Optimized Relief" in source
    assert "Reactive Relief" in source
    assert "ROILiftChart" in source


def test_deployment_page_wires_reoptimization_to_modal_store():
    source = DEPLOYMENT_PAGE.read_text(encoding="utf-8") + DEPLOYMENT_THEATRE.read_text(encoding="utf-8")
    modal_source = OFFICER_MODAL.read_text(encoding="utf-8")

    assert "DeploymentTheatre" in source
    assert "useOptimizerStore" in source
    assert "openOptimizer" in source
    assert "useOptimizeMutation" in modal_source
    assert "query invalidation" not in modal_source.lower()


def test_budget_modal_accepts_arbitrary_typed_budget_without_500_cap():
    source = OFFICER_MODAL.read_text(encoding="utf-8")

    assert "MIN_BUDGET = 0" in source
    assert "const MAX_BUDGET = 500" not in source
    assert "SLIDER_MAX_BUDGET = 500" in source
    assert 'type="number"' in source
    assert "Type officer budget" in source
    assert "clampedBudget" not in source
    assert "officer_budget: normalizedBudget" in source
    assert "Marginal Benefit Curve" not in source
    assert "simulated" not in source.lower()


def test_budget_control_is_visible_outside_command_palette():
    assert BUDGET_CONTROL.exists()
    source = BUDGET_CONTROL.read_text(encoding="utf-8")
    capsule = COMMAND_CAPSULE.read_text(encoding="utf-8")

    assert "OfficerBudgetControl" in capsule
    assert "openOptimizer" in source
    assert "Officer budget" in source
    assert "Change officer budget" in source


def test_command_palette_exposes_high_budget_operator_actions():
    source = COMMAND_PALETTE.read_text(encoding="utf-8")

    assert "Change officer budget" in source
    assert "Set officer budget to 500" in source
    assert "Set officer budget to 1000" in source
    assert "type any number" in source


def test_optimizer_contract_returns_totals_to_frontend():
    backend = APP.read_text(encoding="utf-8")
    types = API_TYPES.read_text(encoding="utf-8")

    assert '"officer_budget": req.officer_budget' in backend
    assert '"totals"' in backend
    assert '"optimized_relief"' in backend
    assert '"reactive_relief"' in backend
    assert '"lift_pct"' in backend
    assert "officer_budget: number" in types
    assert "allocated_officers: number" in types
    assert "unused_officers: number" in types
    assert "optimized_relief: number" in types
    assert "reactive_relief: number" in types
    assert "allocated_officers" in backend
    assert "unused_officers" in backend
