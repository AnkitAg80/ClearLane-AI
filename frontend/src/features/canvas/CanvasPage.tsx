import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapCanvas } from '../../components/map/MapCanvas';
import { CanvasHud } from '../../components/canvas/CanvasHud';
import { DockPanel } from '../../components/canvas/DockPanel';
import { Glass } from '../../components/ui/Glass';
import { useCanvasStore } from '../../stores/useCanvasStore';
import { useSelectionStore } from '../../stores/useSelectionStore';
import { useHotspotDetail } from '../../lib/api/hooks';
import { Badge } from '../../components/ui/Badge';


function InspectorPanelContent({ h3 }: { h3: string | null }) {
  const { data, isLoading } = useHotspotDetail(h3);

  if (!h3) {
    return (
      <div className="text-xs text-fg-secondary text-center py-8">
        Select a hotspot on the map to view details.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-5 w-2/3 bg-bg-elevated/50 rounded" />
        <div className="h-3 w-1/2 bg-bg-elevated/50 rounded" />
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="h-14 bg-bg-elevated/50 rounded" />
          <div className="h-14 bg-bg-elevated/50 rounded" />
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-xs text-fg-secondary text-center py-8">Failed to load details.</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-[10px]">{data.station || 'Unknown'}</Badge>
          <span className="text-[10px] font-mono text-fg-tertiary">{data.h3}</span>
        </div>
        <h3 className="text-sm font-bold text-fg-primary">{data.title}</h3>
        <div className="text-[11px] text-fg-secondary mt-0.5">
          {data.location} {data.junction && `- ${data.junction}`}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {Object.entries(data.scorecards || {}).slice(0, 4).map(([key, value]) => (
          <div key={key} className="rounded-lg border border-border-default bg-bg-canvas/60 p-2">
            <div className="text-[9px] uppercase tracking-wider text-fg-tertiary">{key.replace(/_/g, ' ')}</div>
            <div className="font-tabular text-sm font-semibold text-fg-primary">
              {value !== null ? value.toFixed(3) : '-'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CanvasPage() {
  const [searchParams] = useSearchParams();
  const { selectedH3, select } = useSelectionStore();

  React.useEffect(() => {
    const h3 = searchParams.get('h3');
    if (h3) select(h3);
  }, [searchParams, select]);

  return (
    <div className="h-full w-full relative bg-black overflow-hidden">
      <MapCanvas />

      <CanvasHud />

      <DockPanel id="inspector" title="Inspector" defaultWidth={300}>
        <InspectorPanelContent h3={selectedH3} />
      </DockPanel>

      <DockPanel id="layers" title="Layer Controls" defaultWidth={220}>
        <LayerControlsPanel />
      </DockPanel>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <Glass className="px-4 py-2 rounded-full flex items-center gap-4">
          <div className="text-xs font-medium text-fg-secondary">After deployment: Remaining Next 3h CII</div>
          <div className="w-[1px] h-4 bg-border-default" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sig-calm animate-pulse" />
            <span className="text-xs font-medium text-fg-primary">Live Sync</span>
          </div>
        </Glass>
      </div>
    </div>
  );
}

function LayerControlsPanel() {
  const { layers, toggleLayer } = useCanvasStore();
  const toggleFill = React.useCallback(() => toggleLayer('fill'), [toggleLayer]);
  const toggleExtrude = React.useCallback(() => toggleLayer('extrude'), [toggleLayer]);
  const togglePredicted = React.useCallback(() => toggleLayer('predicted'), [toggleLayer]);
  const toggleOfficers = React.useCallback(() => toggleLayer('officers'), [toggleLayer]);
  const toggleLabels = React.useCallback(() => toggleLayer('labels'), [toggleLayer]);
  const layers_arr = [
    { key: 'fill' as const, label: 'Base Fill', onToggle: toggleFill },
    { key: 'extrude' as const, label: '3D Extrusion', onToggle: toggleExtrude },
    { key: 'predicted' as const, label: 'Predicted CII', onToggle: togglePredicted },
    { key: 'officers' as const, label: 'Officer Counts', onToggle: toggleOfficers },
    { key: 'labels' as const, label: 'Labels', onToggle: toggleLabels },
  ];

  return (
    <div className="space-y-2">
      {layers_arr.map(({ key, label, onToggle }) => (
        <label
          key={key}
          className="flex items-center justify-between cursor-pointer rounded-md px-2 py-1.5 hover:bg-bg-elevated/60 transition-colors text-xs"
        >
          <span className="text-fg-secondary">{label}</span>
          <button
            type="button"
            role="switch"
            aria-checked={layers[key]}
            onClick={onToggle}
            className={`relative h-4 w-7 rounded-full transition-colors ${
              layers[key] ? 'bg-accent' : 'bg-bg-canvas border border-border-default'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white transition-transform ${
                layers[key] ? 'translate-x-3' : 'translate-x-0'
              }`}
            />
          </button>
        </label>
      ))}
    </div>
  );
}
