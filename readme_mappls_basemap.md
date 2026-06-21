# Mappls Basemap Integration

## What Changed

The Command Center map now attempts to load a Mappls / MapMyIndia basemap using the local `MAPPLS_MAP_SDK_KEY`.

The backend exposes a frontend-safe `/api/config` endpoint containing only browser map SDK URLs and fallback map metadata. It does not expose REST client secrets.

The map component now tries to initialize Mappls JavaScript SDK loader variants first. If the SDK fails to load or does not expose a usable map constructor, the dashboard falls back to the existing street-readable CARTO/OpenStreetMap basemap so the demo does not show a blank map.

The map also displays a provider badge: `Map powered by Mappls` when Mappls initializes, or `Fallback street map` when the fallback is active.

The DeckGL canvas is configured as a transparent overlay so the Mappls basemap remains visible underneath the H3 cells.

## Where It Changed

Frontend map configuration is exposed in `app/app.py`.

The frontend config request was added in `frontend/src/api.js`.

The loaded config is passed through `frontend/src/App.jsx`.

Mappls loading, fallback handling, and provider badging were added in `frontend/src/components/CommandMap.jsx`.

Map container and provider badge styles were added in `frontend/src/index.css`.

Regression coverage was added in `tests/test_command_map_source.py` and `tests/test_frontend_config_source.py`.

This note lives in `readme_mappls_basemap.md` at the project root.

## Why It Helps

MapMyIndia is a hackathon partner, so using the Mappls map infrastructure improves project alignment with the challenge. The fallback keeps the product demo stable if the browser SDK key is missing, not enabled for the Web Map SDK, or blocked by domain settings.

## What Should Happen Next

If the app still shows `Fallback street map`, check the Mappls console and confirm the key has Web Map SDK access enabled and is allowed on the current local or deployment domain.
