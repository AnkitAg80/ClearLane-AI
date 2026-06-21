# Location Autocomplete

## What Changed

The command search dropdown now uses location-first autocomplete instead of filtering only police station names.

The backend overview payload now includes ranked location suggestions built from deployed hotspot rows. Each suggestion includes the location text, station, junction, H3 cell, and display metadata.

The toolbar now shows a match count such as `2 matching locations` or `Showing 8 of 23 matching locations`. Selecting a suggestion searches that exact location. Pressing the `Search` button without selecting a suggestion still performs broad search across related matching locations.

## Where It Changed

Location suggestions were added in `app/dashboard_service.py`.

The suggestions are passed through `frontend/src/App.jsx`.

The autocomplete UI changed in `frontend/src/components/Toolbar.jsx`.

Dropdown styling was added in `frontend/src/index.css`.

Regression coverage was updated in `tests/test_dashboard_service.py` and `tests/test_command_center_source.py`.

This note lives in `readme_location_autocomplete.md` at the project root.

## Why It Helps

Users usually remember roads, malls, markets, or local addresses before they remember police station names. Location-first suggestions make searches like `Murphy Road` show exact selectable choices while still allowing broad road-level search if the user simply presses `Search`.

## What Should Happen Next

If live city-wide place search is needed later, add a separate geocoding provider and clearly distinguish external places from hotspot locations that exist in the current model data.
