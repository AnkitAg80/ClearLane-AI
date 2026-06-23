import type { MapFilter, HotspotFilter, IntelFilter } from '../../types/common';

export const qk = {
  health:              ['health'] as const,
  config:              ['config'] as const,
  overview:            ['overview'] as const,
  map:                 (f: MapFilter) => ['map', f] as const,
  hotspots:            (f: HotspotFilter) => ['hotspots', f] as const,
  hotspot:             (h: string) => ['hotspot', h] as const,
  deployment:          ['deployment'] as const,
  evidence:            ['evidence'] as const,
  artifacts:           ['artifacts'] as const,
  featureImportance:   ['feature_importance'] as const,
  intelligence:        (f: IntelFilter) => ['intelligence', f] as const,
  timeline:            (f: IntelFilter) => ['timeline', f] as const,
  missions:            (f: IntelFilter) => ['missions', f] as const,
};
