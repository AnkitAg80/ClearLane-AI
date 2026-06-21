import { GitCompareArrows, TrendingUp } from 'lucide-react';
import MetricCard from './MetricCard';
import Panel from './Panel';
import HotspotTable from './HotspotTable';

export default function DeploymentsView({ deployment, hotspots, selectedH3, onSelect }) {
  const totals = deployment?.totals || {};

  return (
    <div className="view-stack">
      <div className="metrics-grid metrics-grid--compact">
        <MetricCard icon={TrendingUp} label="Optimized relief" value={Number(totals.optimized_relief || 0).toFixed(2)} tone="success" />
        <MetricCard icon={GitCompareArrows} label="Reactive relief" value={Number(totals.reactive_relief || 0).toFixed(2)} tone="warning" />
        <MetricCard icon={TrendingUp} label="Lift" value={`${Number(totals.lift_pct || 0).toFixed(1)}%`} tone="info" />
        <MetricCard label="Optimized officers" value={totals.optimized_officers ?? 0} />
      </div>
      <Panel title="Deployment Plan" eyebrow={`${hotspots.length} matches`}>
        <HotspotTable rows={hotspots} selectedH3={selectedH3} onSelect={onSelect} />
      </Panel>
    </div>
  );
}
