import { Activity, Radar, Route } from 'lucide-react';
import MetricCard from './MetricCard';
import Panel from './Panel';

const formatLabel = (str) => {
  if (!str) return '';
  return str
    .replace(/_/g, ' ')
    .replace(/\bcii\b/gi, 'CII')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const SIGNAL_MEANINGS = {
  current_cii: "Current Congestion Impact Index severity.",
  current_violation_count: "Active traffic violations detected.",
  capacity_ratio: "Current traffic volume vs road capacity.",
  current_capacity_component: "Impact of capacity usage on congestion.",
  current_temporal_component: "Impact of time-of-day on congestion.",
  current_chronic_component: "Long-term persistent congestion factors.",
  cii_lag_1h: "Congestion Impact Index measured 1 hour ago.",
  cii_lag_3h: "Congestion Impact Index measured 3 hours ago.",
  cii_roll_3h_mean: "Average congestion over the past 3 hours.",
  cii_same_hour_1d: "Congestion at this exact hour yesterday.",
  cii_ewm_3h: "Recent exponential trend in congestion.",
  ring1_current_cii_mean: "Average congestion in adjacent areas.",
  ring1_active_neighbor_count: "Adjacent areas with high congestion.",
  support_score: "Confidence level in data and predictions.",
  data_quality_score: "Reliability of the sensor data."
};

export default function HotspotDetail({ detail }) {
  if (!detail) {
    return (
      <Panel title="Hotspot Detail" eyebrow="Explain">
        <div className="empty-state">Select a hotspot from the map or table.</div>
      </Panel>
    );
  }

  const cards = detail.scorecards || {};
  const signals = (detail.signals || [])
    .filter((item) => Number.isFinite(Number(item.value)))
    .map(item => ({ ...item, formattedName: formatLabel(item.name) }));

  const priorityDrivers = signals.slice(0, 5);
  const maxDriverVal = Math.max(...priorityDrivers.map(s => Math.abs(s.value)), 0.01);

  const getSignalValue = (name) => {
    const s = signals.find((s) => s.name === name);
    return s ? s.value : null;
  };

  const capacityUsage = getSignalValue('capacity_ratio');
  const violations = getSignalValue('current_violation_count');

  return (
    <Panel title={detail.title} eyebrow={detail.station || 'Selected hotspot'} className="detail-panel">
      <div className="detail-grid">
        <MetricCard icon={Radar} label="Priority Score" value={Number(cards.deployment_score || 0).toFixed(3)} tone="danger" tooltip="Overall importance weighting calculated by the AI balancing severity, volume, and traffic impact." />
        <MetricCard icon={Activity} label="Predicted Impact (CII)" value={Number(cards.pred_next_3h_cii || 0).toFixed(2)} tone="warning" tooltip="Congestion Impact Index forecasted for the upcoming 3 hours." />
        <MetricCard icon={Route} label="Assigned Personnel" value={cards.officers_assigned ?? 0} tone="success" tooltip="Number of officers specifically deployed to this zone." />
      </div>

      <div className="visual-design-section" style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div>
          <h4 style={{ color: '#f8fafc', fontSize: '16px', marginBottom: '16px', fontWeight: 600 }}>Priority drivers</h4>
          <ul style={{ listStyleType: 'disc', paddingLeft: '24px', margin: 0, color: '#e2e8f0', fontSize: '14px' }}>
            {priorityDrivers.map(s => {
              const widthPct = Math.min(100, (Math.abs(s.value) / maxDriverVal) * 100);
              const meaning = SIGNAL_MEANINGS[s.name] || 'Impact metric for this hotspot.';
              
              return (
                <li key={s.name} style={{ marginBottom: '16px', paddingLeft: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', width: '170px', paddingRight: '8px' }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }} title={s.formattedName}>
                        {s.formattedName}
                      </span>
                      <span style={{ fontSize: '11.5px', color: '#64748b', lineHeight: '1.25', marginTop: '2px', whiteSpace: 'normal' }}>
                        {meaning}
                      </span>
                    </div>
                    <div style={{ width: '120px', height: '16px', backgroundColor: '#020617', border: '1px solid #334155', position: 'relative', overflow: 'hidden', margin: '0 12px', flexShrink: 0, borderRadius: '2px' }}>
                       <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${widthPct}%`, backgroundColor: s.value < 0 ? '#3b82f6' : '#22c55e', opacity: 0.8 }} />
                       <div style={{ position: 'absolute', top: 0, bottom: 0, left: '25%', borderLeft: '1px solid rgba(255,255,255,0.05)' }} />
                       <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', borderLeft: '1px solid rgba(255,255,255,0.05)' }} />
                       <div style={{ position: 'absolute', top: 0, bottom: 0, left: '75%', borderLeft: '1px solid rgba(255,255,255,0.05)' }} />
                    </div>
                    <span style={{ backgroundColor: '#1e293b', color: '#f8fafc', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
                      {s.value > 0 ? '+' : ''}{Number(s.value).toFixed(2)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <h4 style={{ color: '#f8fafc', fontSize: '16px', marginBottom: '16px', fontWeight: 600 }}>Signal health</h4>
          <ul style={{ listStyleType: 'disc', paddingLeft: '24px', margin: 0, color: '#f8fafc', fontSize: '14px', lineHeight: '1.8' }}>
            <li style={{ paddingLeft: '4px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div><span style={{ color: '#94a3b8', marginRight: '6px' }}>Congestion:</span> {Number(cards.pred_next_3h_cii || 0).toFixed(1)} / 100</div>
                <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: '1.3', marginTop: '2px' }}>Overall severity of forecasted traffic delays.</div>
              </div>
            </li>
            <li style={{ paddingLeft: '4px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div><span style={{ color: '#94a3b8', marginRight: '6px' }}>Violations:</span> {violations > 0 ? 'above baseline' : 'normal'}</div>
                <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: '1.3', marginTop: '2px' }}>Current violation counts compared to historical baseline.</div>
              </div>
            </li>
            <li style={{ paddingLeft: '4px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div><span style={{ color: '#94a3b8', marginRight: '6px' }}>Capacity usage:</span> {capacityUsage != null ? `${(capacityUsage * 100).toFixed(0)}%` : 'N/A'}</div>
                <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: '1.3', marginTop: '2px' }}>Percentage of road capacity currently being utilized.</div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </Panel>
  );
}
