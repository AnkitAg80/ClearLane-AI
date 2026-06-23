import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { cellToBoundary } from 'h3-js';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useCanvasStore } from '../../stores/useCanvasStore';
import { useSelectionStore } from '../../stores/useSelectionStore';
import { useConfig, useMapData, useOverview } from '../../lib/api/hooks';
import { rowsToGeoJSON, rowsToPointGeoJSON, selectedToGeoJSON, MAP_LAYERS, applyLayerVisibility, startH3Pulse } from './MapLayers';
import { MapplsSdkBasemap } from './MapplsSdkBasemap';

const INTERACTIVE_LAYERS = ['h3-fill', 'h3-extrude', 'h3-officers', 'h3-labels'];
const MAPPLS_SDK_DIMMED_OPACITY = 0.35;

function emitMapplsView(map: maplibregl.Map) {
  const center = map.getCenter();
  window.dispatchEvent(new CustomEvent('clearlane:map-view', {
    detail: {
      center: [center.lng, center.lat],
      zoom: map.getZoom(),
    },
  }));
}

function existingLayers(map: maplibregl.Map, layerIds: string[]) {
  return layerIds.filter((layerId) => map.getLayer(layerId));
}

export function MapCanvas({ interactive = true }: { interactive?: boolean }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const { viewport, setViewport, layers, selectedH3Pulse, setSelectedH3Pulse } = useCanvasStore();
  const { select, hover, selectedH3 } = useSelectionStore();
  const { data } = useMapData();
  const { data: overview } = useOverview();
  const { data: mapConfig } = useConfig();
  const prevLayers = useRef(layers);
  const stopPulse = useRef<(() => void) | null>(null);
  const mapplsEnabled = Boolean(mapConfig?.provider === 'mappls' && mapConfig.mappls.enabled && mapConfig.mappls.sdk_urls.length > 0);
  const initialCenter: [number, number] = [viewport.longitude || 77.5946, viewport.latitude || 12.9716];
  const initialZoom = viewport.zoom || 11;

  useEffect(() => {
    if (map.current || !mapContainer.current || !mapConfig) return;

    const fallbackTileUrl = mapConfig.provider === 'mappls' && mapConfig.mappls.tile_url
      ? mapConfig.mappls.tile_url
      : mapConfig?.fallback.tile_url || 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
    const attribution = mapConfig.provider === 'mappls'
      ? mapConfig.mappls.attribution
      : (mapConfig?.fallback.attribution || 'CARTO, OpenStreetMap contributors');
    const rasterOpacity = mapConfig.mappls.tile_url
      ? 1
      : mapplsEnabled
        ? MAPPLS_SDK_DIMMED_OPACITY
        : 1;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      interactive,
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          'street-basemap': {
            type: 'raster',
            tiles: [fallbackTileUrl],
            tileSize: 256,
            attribution,
          }
        },
        layers: [
          {
            id: 'base-map',
            type: 'raster',
            source: 'street-basemap',
            minzoom: 0,
            maxzoom: 22,
            paint: {
              'raster-opacity': rasterOpacity,
            },
          }
        ]
      },
      center: initialCenter,
      zoom: initialZoom,
      pitch: viewport.pitch || 0,
      bearing: viewport.bearing || 0,
      attributionControl: false
    });

    if (interactive) {
      map.current.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');

      map.current.on('move', () => {
        if (!map.current) return;
        const center = map.current.getCenter();
        setViewport({
          longitude: center.lng,
          latitude: center.lat,
          zoom: map.current.getZoom(),
          pitch: map.current.getPitch(),
          bearing: map.current.getBearing()
        });
        emitMapplsView(map.current);
      });
    }

    map.current.once('load', () => {
      if (map.current) emitMapplsView(map.current);
    });

    if (interactive) {
      map.current.on('mousemove', (e) => {
        if (!map.current) return;
        const queryLayers = existingLayers(map.current, INTERACTIVE_LAYERS);
        const features = queryLayers.length > 0
          ? map.current.queryRenderedFeatures(e.point, { layers: queryLayers })
          : [];
        if (features.length > 0) {
          map.current.getCanvas().style.cursor = 'pointer';
          const h3Id = features[0].properties?.h3 || features[0].id;
          hover(h3Id as string);
          return;
        }
        map.current.getCanvas().style.cursor = '';
        hover(null);
      });

      map.current.on('click', (e) => {
        if (!map.current) return;
        const queryLayers = existingLayers(map.current, INTERACTIVE_LAYERS);
        const features = queryLayers.length > 0
          ? map.current.queryRenderedFeatures(e.point, { layers: queryLayers })
          : [];
        if (features.length > 0) {
          const h3Id = features[0].properties?.h3 || features[0].id;
          select(h3Id as string);
          setSelectedH3Pulse(true);
        } else {
          select(null);
          setSelectedH3Pulse(false);
        }
      });
    }

    return () => {
      stopPulse.current?.();
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapConfig]);

  // Layer data updates
  useEffect(() => {
    if (!map.current || !data?.rows) return;

    const updateData = () => {
      if (!map.current) return;
      const source = map.current.getSource('hotspots') as maplibregl.GeoJSONSource;
      const pointSource = map.current.getSource('hotspot-centroids') as maplibregl.GeoJSONSource;
      const geojson = rowsToGeoJSON(data.rows);
      const pointGeojson = rowsToPointGeoJSON(data.rows);

      if (source) {
        source.setData(geojson);
        pointSource?.setData(pointGeojson);
      } else {
        map.current.addSource('hotspots', {
          type: 'geojson',
          data: geojson
        });
        map.current.addSource('hotspot-centroids', {
          type: 'geojson',
          data: pointGeojson,
        });
        map.current.addLayer(MAP_LAYERS.FILL as maplibregl.LayerSpecification);
        map.current.addLayer(MAP_LAYERS.PREDICTED as maplibregl.LayerSpecification);
        map.current.addLayer(MAP_LAYERS.STROKE as maplibregl.LayerSpecification);
        map.current.addLayer(MAP_LAYERS.EXTRUDE as maplibregl.LayerSpecification);
        map.current.addLayer(MAP_LAYERS.OFFICERS as maplibregl.LayerSpecification);
        map.current.addLayer(MAP_LAYERS.LABELS as maplibregl.LayerSpecification);

        map.current.addSource('selected-hotspot', {
          type: 'geojson',
          data: selectedToGeoJSON(null),
        });
        map.current.addLayer(MAP_LAYERS.SELECTED_PULSE as maplibregl.LayerSpecification);

        applyLayerVisibility(map.current, 'h3-fill', layers.fill);
        applyLayerVisibility(map.current, 'h3-stroke', layers.fill);
        applyLayerVisibility(map.current, 'h3-predicted', layers.predicted);
        applyLayerVisibility(map.current, 'h3-extrude', layers.extrude);
        applyLayerVisibility(map.current, 'h3-officers', layers.officers);
        applyLayerVisibility(map.current, 'h3-labels', layers.labels);
      }
    };

    if (map.current.isStyleLoaded()) {
      updateData();
    } else {
      map.current.once('styledata', updateData);
    }
  }, [data, layers]);

  // Layer visibility with fade transitions
  useEffect(() => {
    if (!map.current) return;
    const m = map.current;

    if (layers.extrude !== prevLayers.current.extrude) {
      applyLayerVisibility(m, 'h3-extrude', layers.extrude);
    }
    if (layers.fill !== prevLayers.current.fill) {
      applyLayerVisibility(m, 'h3-fill', layers.fill);
      applyLayerVisibility(m, 'h3-stroke', layers.fill);
    }
    if (layers.predicted !== prevLayers.current.predicted) {
      applyLayerVisibility(m, 'h3-predicted', layers.predicted);
    }
    if (layers.officers !== prevLayers.current.officers) {
      applyLayerVisibility(m, 'h3-officers', layers.officers);
    }
    if (layers.labels !== prevLayers.current.labels) {
      applyLayerVisibility(m, 'h3-labels', layers.labels);
    }

    prevLayers.current = layers;
  }, [layers]);

  // Selected H3 pulse
  useEffect(() => {
    if (!map.current) return;
    const m = map.current;
    const source = m.getSource('selected-hotspot') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(selectedToGeoJSON(selectedH3));
    }
    stopPulse.current?.();
    stopPulse.current = null;
    if (selectedH3 && selectedH3Pulse) {
      stopPulse.current = startH3Pulse(m, selectedH3, 'h3-selected-pulse');
    } else {
      if (m.getLayer('h3-selected-pulse')) {
        m.setLayoutProperty('h3-selected-pulse', 'visibility', 'none');
      }
    }
    return () => {
      stopPulse.current?.();
      stopPulse.current = null;
    };
  }, [selectedH3, selectedH3Pulse]);

  // Zoom exact search or route-linked selections into view
  useEffect(() => {
    if (!map.current || !selectedH3) return;
    try {
      const bounds = new maplibregl.LngLatBounds();
      cellToBoundary(selectedH3, true).forEach(([lng, lat]) => bounds.extend([lng, lat]));
      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, { padding: 140, maxZoom: 15.5, duration: 700, essential: false });
      }
    } catch {
      // Invalid or stale H3 ids should never break the canvas.
    }
  }, [selectedH3]);

  // Fit bounds to filtered data if available, otherwise global overview
  useEffect(() => {
    if (!map.current || selectedH3) return; // if single cell is selected, let the other effect handle it

    let west, south, east, north;

    // First try to fit to the filtered data rows
    if (data?.rows && data.rows.length > 0) {
      try {
        const bounds = new maplibregl.LngLatBounds();
        data.rows.forEach((row: any) => {
          if (row.h3) {
            cellToBoundary(row.h3, true).forEach(([lng, lat]) => bounds.extend([lng, lat]));
          }
        });
        if (!bounds.isEmpty()) {
          map.current.fitBounds(bounds, { padding: 48, duration: 700, essential: false });
          return; // done
        }
      } catch {
        // ignore and fallback to overview
      }
    }

    // Fallback to overview bbox
    if (overview?.bbox) {
      if (Array.isArray(overview.bbox)) {
        [west, south, east, north] = overview.bbox;
      } else {
        west = overview.bbox.west;
        south = overview.bbox.south;
        east = overview.bbox.east;
        north = overview.bbox.north;
      }
      
      if ([west, south, east, north].every((value) => typeof value === 'number' && Number.isFinite(value))) {
        map.current.fitBounds(
          [[west, south], [east, north]],
          { padding: 48, duration: 700, essential: false },
        );
      }
    }
  }, [data?.rows, overview?.bbox, selectedH3]);

  return (
    <div className="absolute inset-0 w-full h-full">
      {mapplsEnabled ? (
        <MapplsSdkBasemap
          sdkUrls={mapConfig?.mappls.sdk_urls || []}
          center={initialCenter}
          zoom={initialZoom}
        />
      ) : null}
      <div ref={mapContainer} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
