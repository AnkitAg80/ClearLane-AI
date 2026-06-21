# Congestion Impact Index Method

Gridlock scores parking violations by estimated congestion impact, not by raw count alone.

## Formula

```text
unit_impact = PCU(vehicle_type) * severity(violation_type) * validation_weight
base_impact = sum(unit_impact) by H3 cell, hour, and day-of-week
capacity_ratio = min(base_impact / lane_capacity, ratio_cap)
capacity_component = 1 + alpha * capacity_ratio^beta
temporal_component = rush-hour multiplier
chronic_component = recurrence multiplier
CII = base_impact * capacity_component * temporal_component * chronic_component
confidence_score = mean(validation_weight)
```

## Interpretation

`base_impact` captures the weighted violation load in a cell-time bucket. `capacity_component` uses the BPR-style non-linear delay curve, so cells with impact near or above their lane capacity get penalized more sharply than lightly loaded roads. `temporal_component` raises impact during configured peak hours. `chronic_component` raises recurring hotspots that appear across many distinct days. `confidence_score` stays separate from `cii` so users can see whether a high score is backed by stronger validation evidence.

## Active Inputs

The active road-capacity path uses OSM-derived lane context. Mappls is intentionally not part of active CII scoring because the previous snap-to-road path could not provide lane capacity and defaulted to one lane, which would distort the BPR component.
