import { Activity, BadgeCheck, Radar, Route } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import MetricCard from './MetricCard';
import Panel from './Panel';

export default function HotspotDetail({ detail }) {
  if (!detail) {
    return (
      <Panel title="Hotspot Detail" eyebrow="Explain">
        <div className="empty-state">Select a hotspot from the map or table.</div>
      </Panel>
    );
  }

  const cards = detail.scorecards || {};
  const signals = (detail.signals || []).filter((item) => Number.isFinite(Number(item.value))).slice(0, 12);

  return (
    <Panel title={detail.title} eyebrow={detail.station || 'Selected hotspot'} className="detail-panel">
      <div className="detail-grid">
        <MetricCard icon={Radar} label="Score" value={Number(cards.deployment_score || 0).toFixed(3)} tone="danger" />
        <MetricCard icon={Activity} label="Next 3h CII" value={Number(cards.pred_next_3h_cii || 0).toFixed(2)} tone="warning" />
        <MetricCard icon={Route} label="Officers" value={cards.officers_assigned ?? 0} tone="success" />
        <MetricCard icon={BadgeCheck} label="Support" value={Number(cards.support_score || 0).toFixed(2)} tone="info" />
      </div>

      <div className="meta-strip">
        <span>{detail.location || 'Unknown location'}</span>
        <span>{detail.junction || detail.h3}</span>
        <span>{detail.h3}</span>
      </div>

      <div className="chart-box">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={signals} margin={{ top: 12, right: 12, left: 0, bottom: 42 }}>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={0} angle={-24} textAnchor="end" />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip cursor={{ fill: 'rgba(34, 197, 94, 0.08)' }} contentStyle={{ background: '#020617', border: '1px solid #334155', color: '#f8fafc' }} />
            <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}
