# Gridlock — Congestion-Impact-Weighted Enforcement Prioritizer (Design Spec)

**Date:** 2026-06-16
**Hackathon theme:** Poor Visibility on Parking-Induced Congestion
**Judging lens:** real-world impact (deployable by traffic police, measurable ROI)

---

## 1. Problem & goal

On-street illegal parking chokes carriageways, but enforcement is reactive and patrol-based. There is **no quantification of which parking violations actually harm traffic flow**, so police cannot prioritize. Brief gap: *"No heatmap of parking violations vs. congestion impact. Difficult to prioritize enforcement zones."*

**Goal:** turn 298k geo-tagged parking-violation records into a **ranked, time-aware, congestion-impact-weighted enforcement plan** — a Streamlit tool a traffic officer can act on Monday morning, with validated ROI.

## 2. Data (verified)

- **Violations (primary):** 298,450 rows × 24 cols. `latitude`/`longitude` 0% null. 2023-11-09 → 2024-04-08. 54 police stations, 169 junctions. 27 violation types (96% parking). `vehicle_type` present (scooter/car/auto/maxi-cab). `validation_status` (17% rejected) = data-quality signal.
- **Events/incidents (validation only):** 8,173 rows × 46 cols, geo-tagged. 94% unplanned (breakdowns/potholes/accidents). Same city + window → used as **independent congestion-evidence** to validate CII, not as a forecasting target.

## 3. Scope

**Core + Proactive.** In scope: ingest → recurring hotspots → Congestion-Impact Index → forecast → officer-hour optimization → ROI → Streamlit dashboard. Stretch: full network propagation, full blind-spot model, ILP optimizer, deep ST-forecast, patrol-beat routing, T2 overlay.

## 4. Architecture

**Principle: precompute → dashboard reads artifacts.** Pipeline crunches 298k rows offline, writes small parquet tables; Streamlit only renders → snappy + crash-proof demo.

```
raw CSV → ingest → geo-tag → aggregate(space×time) → CII scoring
                                                        ↓
       dashboard ← optimize(plan+ROI) ← forecast(next-period)
```

**Modules (one responsibility each):**
| Module | Responsibility |
|---|---|
| `src/config.py` | Load `config.yaml` (all tunables). |
| `src/ingest.py` | Load CSV, parse JSON violation arrays, NULL→NaN, timestamps, normalize taxonomies, dedupe. |
| `src/geo.py` | H3 cell (res 9) per row, Bengaluru bbox filter, hour/dow features. |
| `src/aggregate.py` | Counts per `(h3,hour,dow)`, per-cell totals, per-station rollups. |
| `src/roadctx.py` | OSM road class + lanes per cell (OSMnx), cached, capacity proxy. |
| `src/cii.py` | Congestion-Impact Index (6 layers). |
| `src/forecast.py` | Next-period intensity per cell (climatology + LightGBM). |
| `src/optimize.py` | Greedy submodular officer allocation + ROI. |
| `src/pipeline.py` | Orchestrate; write artifacts; `--sample` mode. |
| `app/app.py` | Streamlit UI (reads artifacts only). |

## 5. CII methodology (the multi-novel core)

**Unit = PCU (Passenger Car Units)** — real traffic-engineering standard. Per cell `c`, hour-of-week `t`, violation `v`:
```
ι(v)      = PCU(vehicle) × severity(type) × capacityLoss(road)
CII(c,t)  = Σ ι(v) × demand(c,t) × recurrence(c)   → propagate → de-bias
```
1. **[CORE] Severity weighting** — type→harm (main road / road crossing / bus stop ≫ generic).
2. **[CORE] Physical capacity-loss** — `PCU × lane-share-blocked ÷ road capacity` (OSM lanes+class). Engineering-defensible.
3. **[CORE] Time-conditioned demand** — impact weighted by rush coincidence → CII varies by hour → drives time-windowed patrols.
4. **[CORE] Chronic vs Acute** — temporal-entropy/recurrence → fixed-post vs mobile-patrol vs infra-fix (recommends enforcement TYPE).
5. **[STRETCH] Network spillback** — OSMnx graph propagation to upstream edges → corridor impact. (Light: junction-proximity boost.)
6. **[STRETCH] Enforcement-bias / blind-spot** — exposure de-bias → high-risk + low-coverage cells = "hotspots you're missing". (Light version foldable.)

**Validation:** CII vs independent T2 incidents (cluster overlap > random) + face-validity (known choke points) + temporal stability (train Nov–Feb holds Mar–Apr).

## 6. Forecast + optimize + ROI

- **Forecast:** recency-weighted `(hour×dow)` climatology baseline + LightGBM upgrade. Honest temporal holdout (train Nov–Mar, test Apr), report MAE/MAPE + skill vs naive.
- **Optimize:** greedy submodular allocation — `Δ(c,s,k)=forecastCII(c,s)×effectiveness×decay^(k-1)` with saturation cap + budget. Spreads officers to maximize total relief, not dogpile.
- **ROI:** coverage Pareto (impact vs officers), optimized-vs-reactive-baseline, **backtest on April actuals**, ops units (PCU-hours relieved).

## 7. Dashboard UX

Simplicity-first, progressive disclosure. Default-first-load impressive with zero input; guided demo mode; advanced features collapsed.
- **Impact Map (hero):** H3 choropleth, **count⇄CII toggle** (the pitch), hour slider, click-detail.
- **Hotspot Intelligence:** ranked zones + decomposition + recommended enforcement type.
- **Deployment Planner:** budget slider → assigned cells/officers + downloadable plan CSV.
- **ROI & Validation:** Pareto, baseline bar, April backtest, forecast-accuracy.
- **Stretch overlays:** blind spots, corridor propagation, T2 incident validation.

Tech: pydeck `H3HexagonLayer`, `st.metric`, plotly, `st.download_button`.

## 8. Robustness & testing

- Messy-data guards (`"NULL"`→NaN, JSON try/except, coerce timestamps, taxonomy normalize, dedupe).
- Geo sanity (bbox, drop `(0,0)`/swapped).
- **OSM cached to disk** → offline-safe demo; missing lanes imputed by road class.
- Graceful defaults (unknown vehicle→1.0 PCU, cold-start→climatology, guard ÷0).
- Tests: invariant/property (severity↑→CII↑, peak>off-peak, budget respected, no forecast leakage), parsing edge cases, eval gates (MAE<naive; CII∩incidents>random), smoke on `--sample`, golden synthetic fixture.

## 9. 5-day timeline (walking skeleton)

1. Data foundation + road context. 2. CII L1–L4 + hero map (WOW by Day 2). 3. Forecast + optimize + ROI. 4. Stretch overlays + UX polish + tests. 5. Bug bash, offline verify, demo dry-runs, pitch.

## 10. Success criteria

Working Streamlit demo on real 298k data; count⇄CII toggle shows materially different priority maps; forecast beats naive on April holdout; optimizer produces a downloadable budget-constrained plan with a coverage curve; CII validated against independent incident data.

## Tech stack

Python 3.14, pandas, numpy, h3 (v4), osmnx (1.9.x), scikit-learn, lightgbm, streamlit, pydeck, plotly, pyyaml, pyarrow, pytest.
