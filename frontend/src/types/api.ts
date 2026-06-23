export type MetricKey = string;

export interface Health {
  status: 'ready' | 'missing_artifacts';
  missing_count: number;
  processed_dir: string;
}

export interface MapConfig {
  provider: 'mappls' | 'carto';
  mappls: {
    enabled: boolean;
    sdk_url: string;
    sdk_urls: string[];
    style_url: string;
    tile_url: string;
    attribution: string;
  };
  fallback: { provider: string; tile_url: string; attribution: string };
}

export interface OverviewSummary {
  officers_deployed: number;
  active_cells: number;
  expected_relief: number;
  forecast_pressure: number;
  lift_pct: number;
  deployment_score_top25_recall: number | null;
  mean_ndcg_at_25: number | null;
}

export interface SearchSuggestion { 
  type: 'location'; 
  label: string; 
  value: string; 
  station: string | null; 
  junction: string | null; 
  h3: string | null; 
  secondary: string; 
}

export interface BboxObject {
  west: number;
  south: number;
  east: number;
  north: number;
}

export type Bbox = [number, number, number, number] | BboxObject;

export interface Overview {
  summary: OverviewSummary;
  highlights: {
    lift_pct: number;
    optimized_relief: number | null;
    reactive_relief: number | null;
    deployment_score_top25_recall: number | null;
    deployment_score_ndcg_at_25: number | null;
  };
  filters: { stations: string[]; suggestions: SearchSuggestion[]; support: { min: number; max: number } };
  artifacts: ArtifactRow[];
  bbox: Bbox | null;   // array [west, south, east, north] or backend object {west,south,east,north}
}

export interface MapRow {
  h3: string;
  label: string;
  top_location: string | null;
  top_junction: string | null;
  top_police_station: string | null;
  deployment_score: number;
  pred_next_3h_cii: number;
  rank_score: number;
  expected_relief: number;
  officers_assigned: number;
  forecast_cii: number;
  current_cii: number;
  current_violation_count: number;
  support_score: number;
  data_quality_score: number;
  remaining_next_3h_cii: number;
  metric_values: Record<MetricKey, number>;
  // + all original cii columns
  [k: string]: unknown;
}

export interface MapResponse {
  rows: MapRow[];
}

export interface HotspotRow extends Partial<MapRow> {
  h3: string;
}

export interface HotspotList {
  rows: HotspotRow[];
}

export interface HotspotDetail {
  h3: string;
  title: string;
  station: string | null;
  location: string | null;
  junction: string | null;
  scorecards: Record<string, number | null>;
  signals: { name: string; value: number | null }[];
  raw: Record<string, unknown>;
}

export interface DeploymentPayload {
  totals: {
    optimized_relief: number | null;
    reactive_relief: number | null;
    lift_pct: number;
    optimized_officers: number;
    reactive_officers: number;
  };
  optimized: HotspotRow[];
  reactive: Record<string, unknown>[];
}

export interface IntelligenceRow extends HotspotRow {
  capacity_theft: number;
  lifecycle: 'active' | 'spreading' | 'chronic' | 'dormant' | 'resolving';
  criticality: { minutes_to_critical: number | null; severity: string };
  fingerprint: string;
  opportunity_gap: number;
  pred_next_1h_cii?: number;
  pred_next_1h_cii_proxy?: number;
  pred_next_2h_cii?: number;
  pred_next_2h_cii_proxy?: number;
  forecast_horizon_source: 'learned' | 'proxy_from_next_3h';
}

export interface IntelligencePayload {
  rows: IntelligenceRow[];
  summary?: {
    total_hotspots: number;
    critical_count: number;
    total_opportunity_gap: number;
  }
}

export interface TimelinePayload {
  horizons: ('now' | '+60m' | '+3h' | 'pattern')[];
  horizon_source: 'learned' | 'proxy_from_next_3h';
  rows: IntelligenceRow[];
}

export interface MissionCard {
  h3: string;
  label: string;
  // fields produced by build_mission_card in curb_intelligence.py
  [k: string]: unknown;
}

export interface MissionPayload {
  rows: MissionCard[];
}

export interface FeatureRow {
  feature: string;
  importance: number;
}

export interface Evidence {
  backtest: Record<string, number | null>;
  roi: Record<string, number | null>;
  model: { target_column: string; prediction_column: string; ranker_enabled: boolean; features: string[] };
  feature_importance: { regression: FeatureRow[]; ranker: FeatureRow[] };
  artifacts: ArtifactRow[];
}

export interface ArtifactRow { 
  artifact: string; 
  exists: boolean; 
  path: string; 
  size_mb: number; 
}

export interface ArtifactList {
  artifacts: ArtifactRow[];
}

export interface FeatureImportance {
  regression: FeatureRow[];
  ranker: FeatureRow[];
}

export interface OfficerBudget {
  officer_budget: number;
}

export interface OptimizeResult {
  status: string;
  officer_budget: number;
  allocated_officers: number;
  unused_officers: number;
  totals: {
    optimized_relief: number;
    reactive_relief: number;
    lift_pct: number;
  }
}
