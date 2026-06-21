import { useMemo, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { BitmapLayer } from '@deck.gl/layers';
import { H3HexagonLayer, TileLayer } from '@deck.gl/geo-layers';
import { LocateFixed, MousePointer2 } from 'lucide-react';

const metricLabels = {
  deployment_score: 'Deployment score',
  pred_next_3h_cii: 'Predicted next-3h CII',
  remaining_next_3h_cii: 'Remaining next-3h CII',
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
      id: 'clearlane-street-basemap',
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
      id: 'clearlane-h3-command-layer',
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

      <MapLegend metricMode={metricMode} maxMetric={maxMetric} />
    </div>
  );
}

function MapLegend({ metricMode, maxMetric }) {
  const modeLabels = {
    deployment_score: { title: 'Deployment Score', unit: '' },
    pred_next_3h_cii: { title: 'Predicted Next 3h CII', unit: '' },
    remaining_next_3h_cii: { title: 'Remaining Next 3h CII', unit: '' },
    officers_assigned: { title: 'Officers Assigned', unit: '' },
    expected_relief: { title: 'Expected Relief', unit: '' },
  };
  const { title, unit } = modeLabels[metricMode] || { title: 'Metric', unit: '' };

  const formatVal = (val) => {
    if (metricMode === 'officers_assigned') return Math.max(0, Math.round(val));
    return Number(val).toFixed(2);
  };

  const ranges = [
    { color: 'rgba(220, 38, 38, 0.8)', label: 'High', text: `> ${formatVal(maxMetric * 0.75)} ${unit}`.trim() },
    { color: 'rgba(217, 119, 6, 0.8)', label: 'Medium', text: `${formatVal(maxMetric * 0.45)} - ${formatVal(maxMetric * 0.75)}` },
    { color: 'rgba(22, 163, 74, 0.8)', label: 'Low', text: `${formatVal(maxMetric * 0.15)} - ${formatVal(maxMetric * 0.45)}` },
    { color: 'rgba(71, 85, 105, 0.8)', label: 'Minimal', text: `< ${formatVal(maxMetric * 0.15)} ${unit}`.trim() },
  ];

  return (
    <div style={{
      position: 'absolute',
      bottom: '14px',
      right: '14px',
      zIndex: 2,
      border: '1px solid var(--line)',
      borderRadius: '8px',
      background: 'rgba(2, 6, 23, 0.84)',
      backdropFilter: 'blur(14px)',
      padding: '12px 14px',
      color: '#e2e8f0',
      fontSize: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      minWidth: '180px'
    }}>
      <strong style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '4px' }}>{title}</strong>
      {ranges.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '4px', background: r.color }}></span>
            <span>{r.label}</span>
          </div>
          <span style={{ color: 'var(--muted)', fontFamily: 'monospace' }}>{r.text}</span>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
        <span style={{ width: '12px', height: '12px', borderRadius: '4px', border: '2px solid rgba(8, 145, 178, 1)', background: 'transparent' }}></span>
        <span>Selected Location</span>
      </div>
    </div>
  );
}
