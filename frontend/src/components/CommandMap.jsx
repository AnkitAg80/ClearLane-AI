import { useMemo, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { BitmapLayer } from '@deck.gl/layers';
import { H3HexagonLayer, TileLayer } from '@deck.gl/geo-layers';
import { LocateFixed, MousePointer2 } from 'lucide-react';

const metricLabels = {
  deployment_score: 'Deployment score',
  pred_next_3h_cii: 'Predicted next-3h CII',
  officers_assigned: 'Officers',
  expected_relief: 'Expected relief',
  support_score: 'Support score',
};

function metricValue(row, metricMode) {
  return Number(row?.metric_values?.[metricMode] ?? row?.[metricMode] ?? 0);
}

function colorFor(value, max, selected) {
  if (selected) return [8, 145, 178, 205];
  const ratio = max > 0 ? Math.max(0, Math.min(value / max, 1)) : 0;
  if (ratio > 0.75) return [220, 38, 38, 150];
  if (ratio > 0.45) return [217, 119, 6, 135];
  if (ratio > 0.15) return [22, 163, 74, 120];
  return [71, 85, 105, 78];
}

export default function CommandMap({ rows, bbox, selectedH3, onSelect, metricMode }) {
  const [hovered, setHovered] = useState(null);
  const [viewState, setViewState] = useState(() => ({
    longitude: bbox?.east && bbox?.west ? (bbox.east + bbox.west) / 2 : 77.5946,
    latitude: bbox?.north && bbox?.south ? (bbox.north + bbox.south) / 2 : 12.9716,
    zoom: 11.2,
    pitch: 0,
    bearing: 0,
  }));

  const maxMetric = useMemo(() => {
    return Math.max(1, ...rows.map((row) => metricValue(row, metricMode)));
  }, [rows, metricMode]);

  const layers = useMemo(() => [
    new TileLayer({
      id: 'gridlock-street-basemap',
      data: 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      maxZoom: 19,
      minZoom: 0,
      tileSize: 256,
      renderSubLayers: (props) => {
        const { boundingBox } = props.tile;
        return new BitmapLayer(props, {
          data: null,
          image: props.data,
          bounds: [
            boundingBox[0][0],
            boundingBox[0][1],
            boundingBox[1][0],
            boundingBox[1][1],
          ],
        });
      },
    }),
    new H3HexagonLayer({
      id: 'gridlock-h3-command-layer',
      data: rows,
      pickable: true,
      filled: true,
      extruded: false,
      wireframe: false,
      getHexagon: (row) => row.h3,
      getFillColor: (row) => colorFor(metricValue(row, metricMode), maxMetric, selectedH3 === row.h3),
      onHover: (info) => setHovered(info.object || null),
      onClick: (info) => {
        if (info.object) onSelect(info.object.h3);
      },
      updateTriggers: {
        getFillColor: [selectedH3, metricMode, maxMetric],
      },
      transitions: {
        getFillColor: 220,
      },
    }),
  ], [rows, selectedH3, metricMode, maxMetric, onSelect]);

  return (
    <div className="map-stage">
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: next }) => setViewState(next)}
        controller
        layers={layers}
      />

      <div className="map-badge">
        <LocateFixed size={16} aria-hidden="true" />
        <span>{metricLabels[metricMode] || 'Metric'}</span>
      </div>

      <div className="map-hint">
        <MousePointer2 size={15} aria-hidden="true" />
        <span>Click a cell to lock details</span>
      </div>

      {hovered && (
        <aside className="map-tooltip">
          <strong>{hovered.map_label || hovered.label || hovered.h3}</strong>
          <span>{hovered.top_police_station || 'Unassigned station'}</span>
          <dl>
            <dt>Score</dt>
            <dd>{Number(hovered.deployment_score || 0).toFixed(3)}</dd>
            <dt>Next 3h</dt>
            <dd>{Number(hovered.pred_next_3h_cii || 0).toFixed(2)}</dd>
            <dt>Officers</dt>
            <dd>{hovered.officers_assigned || 0}</dd>
          </dl>
        </aside>
      )}
    </div>
  );
}
