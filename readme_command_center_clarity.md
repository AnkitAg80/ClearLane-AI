# Command Center Clarity

## What Changed

The Command Center summary card formerly labeled `Critical Zones` now reads `Deployed Places`. Its tooltip now explains that the value means places receiving at least one assigned officer in the current deployment plan.

The traffic relief card now reads `Expected CII Relief` and includes the sublabel `CII reduction units`. This clarifies that the value is not a percentage. It is the modeled reduction in Congestion Impact Index units.

The map now supports a derived `remaining_next_3h_cii` metric. This value is computed as `max(pred_next_3h_cii - expected_relief, 0)`, so the UI can show estimated remaining congestion after deployment instead of only the raw forecast.

The Command Center map metric switcher now includes an `After deployment` option for that remaining CII layer. The existing forecast layer remains available as `Forecast`, which keeps raw predicted next-3-hour CII separate from post-deployment impact.

The Command Center search control now has an explicit `Search` button instead of relying only on the magnifying-glass icon.

## Where It Changed

The map row metric was added in `app/dashboard_service.py`.

The Command Center metric labels changed in `frontend/src/App.jsx`.

The map metric labels changed in `frontend/src/components/CommandMap.jsx`.

The search button and map metric options changed in `frontend/src/components/Toolbar.jsx`.

The search button styling changed in `frontend/src/index.css`.

Regression coverage changed in `tests/test_dashboard_service.py`, `tests/test_command_map_source.py`, and `tests/test_command_center_source.py`.

This note lives in `readme_command_center_clarity.md` at the project root.

## Why It Helps

The previous UI mixed together raw forecast, officer allocation, and post-deployment relief. That made it look like changing officers should alter the `Next 3h` forecast layer, even though that layer represented pre-deployment predicted CII.

The new labels separate the concepts: `Forecast` is the pre-deployment prediction, while `After deployment` is the estimated remaining CII after expected relief. The summary cards now use operational wording that matches the underlying data.

## What Should Happen Next

The next coherent change should clean up the Active Deployments optimizer panel: fix or remove the static mode buttons, handle officer budgets above 500 without a maxed-out slider mismatch, rename hotspot coverage language, and review the marginal benefit curve.

After that, the AI Explanation Console should be checked for simulated or static visuals and unresponsive action buttons.

## Verification

Ran `pytest tests/test_dashboard_service.py tests/test_command_map_source.py tests/test_command_center_source.py -q`; all 17 focused tests passed.

Ran `npm run build` in `frontend`; Vite built successfully and reported only the existing large-chunk warning.
