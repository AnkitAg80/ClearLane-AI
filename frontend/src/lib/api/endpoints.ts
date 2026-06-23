import { client } from './client';
import type { 
  Health, MapConfig, Overview, MapResponse, 
  HotspotList, HotspotDetail, DeploymentPayload, 
  OptimizeResult, Evidence, ArtifactList, 
  FeatureImportance, IntelligencePayload, 
  TimelinePayload, MissionPayload, OfficerBudget
} from '../../types/api';
import type { MapFilter, HotspotFilter, IntelFilter } from '../../types/common';

export const api = {
  health:           ()                       => client.get<Health>('/health'),
  config:           ()                       => client.get<MapConfig>('/config'),
  overview:         ()                       => client.get<Overview>('/overview'),
  map:              (f: MapFilter)           => client.get<MapResponse>('/map', f),
  hotspots:         (f: HotspotFilter)       => client.get<HotspotList>('/hotspots', f),
  hotspotDetail:    (h3: string)             => client.get<HotspotDetail>(`/hotspots/${h3}`),
  deployment:       ()                       => client.get<DeploymentPayload>('/deployment'),
  optimize:         (b: OfficerBudget)       => client.post<OptimizeResult>('/optimize', b),
  evidence:         ()                       => client.get<Evidence>('/evidence'),
  artifacts:        ()                       => client.get<ArtifactList>('/artifacts'),
  featureImportance:()                       => client.get<FeatureImportance>('/feature_importance'),
  intelligence:     (f: IntelFilter)         => client.get<IntelligencePayload>('/intelligence', f),
  timeline:         (f: IntelFilter)         => client.get<TimelinePayload>('/timeline', f),
  missions:         (f: IntelFilter)         => client.get<MissionPayload>('/missions', f),
};
