from pathlib import Path


DEPLOYMENT_CONSOLE = Path("frontend/src/components/DeploymentConsole.jsx")
BUDGET_CARD = Path("frontend/src/components/BudgetCard.jsx")


def test_deployment_console_removes_unwired_strategy_buttons():
    source = DEPLOYMENT_CONSOLE.read_text(encoding="utf-8")

    assert "Reactive Base</button>" not in source
    assert "Manual</button>" not in source
    assert "mode" not in source


def test_deployment_console_uses_deployed_places_and_cii_relief_language():
    source = DEPLOYMENT_CONSOLE.read_text(encoding="utf-8")

    assert "Deployed Places Covered" in source
    assert "Critical Hotspots Covered" not in source
    assert "critical hotspots" not in source
    assert "Expected CII Relief" in source
    assert "CII reduction units" in source


def test_deployment_console_uses_dynamic_slider_range_and_no_simulated_curve():
    source = DEPLOYMENT_CONSOLE.read_text(encoding="utf-8")

    assert "sliderMax" in source
    assert 'max="500"' not in source
    assert "Marginal Benefit Curve" not in source
    assert "simulated" not in source.lower()


def test_budget_card_uses_dynamic_slider_range():
    source = BUDGET_CARD.read_text(encoding="utf-8")

    assert "sliderMax" in source
    assert 'max="500"' not in source
