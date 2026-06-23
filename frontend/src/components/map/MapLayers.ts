import { cellToBoundary } from 'h3-js';
import type maplibregl from 'maplibre-gl';
import type { MapRow } from '../../types/api';

export function rowsToGeoJSON(rows: MapRow[]) {
  return {
    type: 'FeatureCollection' as const,
    features: rows.flatMap(row => {
      try {
        const rawBoundary = cellToBoundary(row.h3, true);
        const boundary = [...rawBoundary, rawBoundary[0]];
        return [{
          type: 'Feature' as const,
          id: row.h3,
          properties: {
            ...row
          },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [boundary]
          }
        }];
      } catch {
        return [];
      }
    })
  };
}

export function rowsToPointGeoJSON(rows: MapRow[]) {
  return {
    type: 'FeatureCollection' as const,
    features: rows.flatMap(row => {
      try {
        const boundary = cellToBoundary(row.h3, true);
        const center = boundary.reduce(
          (acc, point) => [acc[0] + point[0], acc[1] + point[1]],
          [0, 0],
        ).map((value) => value / boundary.length) as [number, number];
        return [{
          type: 'Feature' as const,
          id: row.h3,
          properties: { ...row },
          geometry: {
            type: 'Point' as const,
            coordinates: center,
          },
        }];
      } catch {
        return [];
      }
    }),
  };
}

export function selectedToGeoJSON(h3: string | null) {
  if (!h3) return { type: 'FeatureCollection' as const, features: [] };
  try {
    const rawBoundary = cellToBoundary(h3, true);
    const boundary = [...rawBoundary, rawBoundary[0]];
    return {
      type: 'FeatureCollection' as const,
      features: [{
        type: 'Feature' as const,
        id: h3,
        properties: {},
        geometry: {
          type: 'Polygon' as const,
          coordinates: [boundary]
        }
      }]
    };
  } catch {
    return { type: 'FeatureCollection' as const, features: [] };
  }
}

export const FADE_DURATION = 300;

export function getLayerPaintOpacityProperty(map: maplibregl.Map, layerId: string) {
  const layer = map.getLayer(layerId);
  if (!layer) return null;
  switch (layer.type) {
    case 'fill':
      return 'fill-opacity';
    case 'fill-extrusion':
      return 'fill-extrusion-opacity';
    case 'line':
      return 'line-opacity';
    case 'circle':
      return 'circle-opacity';
    case 'symbol':
      return 'text-opacity';
    default:
      return null;
  }
}

function getLayerTargetOpacity(layerId: string, opacityProperty: string) {
  if (opacityProperty === 'fill-extrusion-opacity') return 0.78;
  if (opacityProperty === 'line-opacity') return 0.72;
  if (opacityProperty === 'circle-opacity') return layerId === 'h3-officers' ? 0.88 : 0.65;
  if (opacityProperty === 'text-opacity') return 0.95;
  if (layerId === 'h3-predicted') return 0.42;
  if (layerId === 'h3-selected-pulse') return 0.36;
  return 0.56;
}

export function applyLayerVisibility(map: maplibregl.Map, layerId: string, visible: boolean) {
  if (!map.getLayer(layerId)) return;
  const opacityProperty = getLayerPaintOpacityProperty(map, layerId);
  if (!opacityProperty) {
    map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
    return;
  }

  const paintOpacityProperty = opacityProperty;
  const targetOpacity = getLayerTargetOpacity(layerId, paintOpacityProperty);
  if (visible) {
    map.setLayoutProperty(layerId, 'visibility', 'visible');
    map.setPaintProperty(layerId, paintOpacityProperty, 0);
    const start = performance.now();
    function fadeIn(time: number) {
      const progress = Math.min((time - start) / FADE_DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentOpacity = eased * targetOpacity;
      map.setPaintProperty(layerId, paintOpacityProperty, currentOpacity);
      if (progress < 1) requestAnimationFrame(fadeIn);
    }
    requestAnimationFrame(fadeIn);
  } else {
    const currentOpacity = map.getPaintProperty(layerId, paintOpacityProperty) as number;
    const startOpacity = typeof currentOpacity === 'number' ? currentOpacity : targetOpacity;
    const start = performance.now();
    function fadeOut(time: number) {
      const progress = Math.min((time - start) / FADE_DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentOpacity = startOpacity * (1 - eased);
      map.setPaintProperty(layerId, paintOpacityProperty, currentOpacity);
      if (progress < 1) {
        requestAnimationFrame(fadeOut);
      } else {
        map.setLayoutProperty(layerId, 'visibility', 'none');
      }
    }
    requestAnimationFrame(fadeOut);
  }
}

export function startH3Pulse(map: maplibregl.Map, h3: string | null, layerId: string) {
  if (!map.getLayer(layerId)) return () => undefined;
  if (!h3) {
    map.setLayoutProperty(layerId, 'visibility', 'none');
    return () => undefined;
  }
  map.setLayoutProperty(layerId, 'visibility', 'visible');
  let growing = true;
  let timeoutId: number | undefined;
  let cancelled = false;
  function pulse() {
    if (cancelled || !map.getLayer(layerId)) return;
    const current = map.getPaintProperty(layerId, 'fill-opacity') as number;
    const step = growing ? 0.02 : -0.02;
    const next = Math.max(0.15, Math.min(0.45, (current ?? 0.3) + step));
    map.setPaintProperty(layerId, 'fill-opacity', next);
    if (next >= 0.45 || next <= 0.15) growing = !growing;
    timeoutId = window.setTimeout(pulse, 120);
  }
  pulse();
  return () => {
    cancelled = true;
    if (timeoutId) window.clearTimeout(timeoutId);
  };
}

export function addSelectedPulseLayer(map: maplibregl.Map, sourceId: string) {
  if (map.getLayer('h3-selected-pulse')) return;
  map.addLayer({
    id: 'h3-selected-pulse',
    type: 'fill',
    source: sourceId,
    paint: {
      'fill-color': 'rgba(94, 106, 210, 0.3)',
      'fill-opacity': 0.3,
      'fill-outline-color': 'rgba(94, 106, 210, 0.6)',
    },
    filter: ['==', ['get', 'deployment_score'], -1],
  });
}

// MapLibre layer specs
export const MAP_LAYERS = {
  FILL: {
    id: 'h3-fill',
    type: 'fill' as const,
    source: 'hotspots',
    paint: {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['coalesce', ['get', 'deployment_score'], 0],
        0, 'rgba(42, 47, 61, 0.2)',
        0.5, 'rgba(255, 179, 71, 0.5)',
        0.8, 'rgba(255, 92, 92, 0.7)'
      ],
      'fill-opacity': 0.55
    }
  },
  EXTRUDE: {
    id: 'h3-extrude',
    type: 'fill-extrusion' as const,
    source: 'hotspots',
    paint: {
      'fill-extrusion-color': [
        'interpolate',
        ['linear'],
        ['coalesce', ['get', 'deployment_score'], 0],
        0, '#2A2F3D',
        0.5, '#FFB347',
        1.0, '#FF5C5C'
      ],
      'fill-extrusion-height': [
        '*',
        ['coalesce', ['get', 'deployment_score'], 0],
        2000
      ],
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': 0.8
    }
  },
  STROKE: {
    id: 'h3-stroke',
    type: 'line' as const,
    source: 'hotspots',
    paint: {
      'line-color': 'rgba(255, 255, 255, 0.18)',
      'line-width': 1,
      'line-opacity': 0.72,
    }
  },
  PREDICTED: {
    id: 'h3-predicted',
    type: 'fill' as const,
    source: 'hotspots',
    paint: {
      'fill-color': [
        'interpolate',
        ['linear'],
        ['coalesce', ['get', 'remaining_next_3h_cii'], 0],
        0, 'rgba(74, 222, 128, 0.12)',
        50, 'rgba(255, 217, 102, 0.22)',
        100, 'rgba(255, 92, 92, 0.34)'
      ],
      'fill-opacity': 0.4
    }
  },
  OFFICERS: {
    id: 'h3-officers',
    type: 'circle' as const,
    source: 'hotspot-centroids',
    paint: {
      'circle-color': [
        'step',
        ['coalesce', ['get', 'officers_assigned'], 0],
        'rgba(148, 163, 184, 0.0)',
        1, '#38bdf8',
        3, '#4ade80',
        8, '#fbbf24',
        16, '#fb7185',
      ],
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['coalesce', ['get', 'officers_assigned'], 0],
        0, 0,
        1, 4,
        10, 10,
        50, 18,
        200, 28,
        500, 38,
      ],
      'circle-opacity': 0.88,
      'circle-stroke-color': 'rgba(255, 255, 255, 0.72)',
      'circle-stroke-width': [
        'interpolate',
        ['linear'],
        ['coalesce', ['get', 'officers_assigned'], 0],
        0, 0,
        1, 1,
        50, 1.5,
      ],
      'circle-stroke-opacity': 0.7,
    }
  },
  LABELS: {
    id: 'h3-labels',
    type: 'symbol' as const,
    source: 'hotspot-centroids',
    layout: {
      'text-field': [
        'concat',
        ['to-string', ['coalesce', ['get', 'officers_assigned'], 0]],
        ' | ',
        ['coalesce', ['get', 'top_location'], ['get', 'label'], ['get', 'h3']],
      ],
      'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
      'text-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        9, 9,
        12, 11,
        15, 13,
      ],
      'text-offset': [0, 1.3],
      'text-anchor': 'top',
      'visibility': 'visible',
    },
    paint: {
      'text-color': '#f8fafc',
      'text-halo-color': 'rgba(2, 6, 23, 0.9)',
      'text-halo-width': 1.2,
      'text-opacity': 0.95,
    }
  },
  SELECTED_PULSE: {
    id: 'h3-selected-pulse',
    type: 'fill' as const,
    source: 'selected-hotspot',
    paint: {
      'fill-color': 'rgba(94, 106, 210, 0.35)',
      'fill-opacity': 0.35,
      'fill-outline-color': 'rgba(94, 106, 210, 0.7)',
    },
  },
};
