# Deployments And Explanation Cleanup

## What Changed

The Active Deployments optimizer now has one real action path: change the officer budget and run `Optimize Deployment`. The previous `AI Optimized`, `Reactive Base`, and `Manual` segmented buttons were removed because they changed local UI state only and did not connect to separate backend strategies.

The officer budget slider now uses a dynamic maximum instead of a fixed `500`. If the current deployment or typed budget is greater than 500, the slider range expands so values like 2000 no longer appear incorrectly maxed out.

Active Deployments now uses `Expected CII Relief` and `CII reduction units` instead of generic traffic-relief wording. `Critical Hotspots Covered` and `Hotspots Covered` were renamed to `Deployed Places Covered`, matching the actual metric: places assigned at least one officer.

The recommendation sentence now says the AI deploys officers across deployed places, not critical hotspots. The misleading marginal benefit mini chart was removed.

The AI Explanation Console no longer shows the simulated congestion time-series bars. It now shows direct forecast input values and deployment impact. The static `Deploy Officers` and `Open in Command Map` buttons were replaced with non-clickable operator guidance, since those actions were not wired to real handlers.

## Where It Changed

The Active Deployments UI changed in `frontend/src/components/DeploymentConsole.jsx`.

The shared assigned-officer budget card changed in `frontend/src/components/BudgetCard.jsx`.

The AI Explanation Console changed in `frontend/src/components/HotspotDetail.jsx`.

Regression coverage was added in `tests/test_deployment_console_source.py` and `tests/test_hotspot_detail_source.py`.

This note lives in `readme_deployments_explain_cleanup.md` at the project root.

## Why It Helps

The previous UI mixed real optimization behavior with static or local-only controls. That made the app look interactive in places where nothing meaningful happened.

The cleanup keeps only controls that have an actual data path, labels CII relief honestly, and removes simulated visual explanations that could mislead reviewers.

## What Should Happen Next

If the project later needs true strategy modes, add backend-supported endpoints for AI optimized, reactive baseline, and manual plans before restoring those controls.

If the explanation console needs a real time-series chart, feed it actual historical CII rows or forecast buckets rather than interpolated placeholder bars.

## Verification

Ran `pytest tests/test_dashboard_service.py tests/test_command_map_source.py tests/test_command_center_source.py tests/test_deployment_console_source.py tests/test_hotspot_detail_source.py -q`; all 23 focused tests passed.

Ran `npm run build` in `frontend`; Vite built successfully.

Reloaded `http://127.0.0.1:8501` in the in-app browser. Active Deployments showed `Deployed Places Covered`, no dead strategy tabs, no marginal benefit curve, and the corrected CII relief wording. AI Explanation showed `Forecast Inputs`, `Operator Guidance`, and no static deploy/open buttons. Browser console errors were empty.
