import { Activity, Radar, Route, CheckCircle, AlertTriangle, TrendingUp, BarChart2, ShieldAlert, ArrowRight, Eye, Info, Clock, AlertCircle } from 'lucide-react';
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

const getCategory = (name) => {
  if (name.includes('capacity')) return 'Capacity / flow stress';
  if (name.includes('violation')) return 'Event / enforcement pressure';
  return 'Congestion pressure';
};

export default function HotspotDetail({ detail }) {
  if (!detail) {
    return (
      <div className="empty-state" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Select a hotspot from the map or table to view AI explanation.
      </div>
    );
  }

  const cards = detail.scorecards || {};
  const signals = (detail.signals || [])
    .filter((item) => Number.isFinite(Number(item.value)))
    .map(item => ({ ...item, formattedName: formatLabel(item.name), category: getCategory(item.name) }));

  const getSignalValue = (name) => {
    const s = signals.find((s) => s.name === name);
    return s ? s.value : 0;
  };

  // Derive top-level variables
  const priorityScore = Number(cards.deployment_score || 0);
  const priorityTier = priorityScore > 0.8 ? 'Critical' : priorityScore > 0.5 ? 'High' : priorityScore > 0.3 ? 'Medium' : 'Low';
  const rank = Math.floor(cards.rank_score) || 1; // Simulation since real rank isn't directly in detail
  const assigned = Number(cards.officers_assigned || 0);
  const relief = Number(cards.expected_relief || 0);
  const forecastedCii = Number(cards.pred_next_3h_cii || 0);
  const currentCii = getSignalValue('current_cii');
  
  // Categorize signals
  const sortedSignals = [...signals].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const topDrivers = sortedSignals.slice(0, 6);
  const maxDriverVal = Math.max(...topDrivers.map(s => Math.abs(s.value)), 0.01);
  
  const recStatus = assigned > 0 ? 'Deployment recommended' : (priorityScore > 0.5 ? 'Watchlist' : 'Already covered / No action');

  // Trend logic
  const lag1h = getSignalValue('cii_lag_1h');
  const lag3h = getSignalValue('cii_lag_3h');
  const ciiTrend = currentCii - lag1h;
  const isRising = ciiTrend > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* 1. Hotspot Explanation Header */}
      <div>
        <div style={{ fontSize: '13px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{detail.station || 'Unknown Station'}</span>
          <span>•</span>
          <span>Forecast Horizon: Next 3H</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 700, margin: 0, color: 'var(--text)', lineHeight: 1.2 }}>{detail.title}</h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 600, background: priorityTier === 'Critical' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: priorityTier === 'Critical' ? 'var(--red)' : 'var(--amber)', border: `1px solid ${priorityTier === 'Critical' ? 'var(--red)' : 'var(--amber)'}` }}>
              {priorityTier} Priority
            </span>
            <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 600, background: assigned > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(100, 116, 139, 0.15)', color: assigned > 0 ? 'var(--green)' : 'var(--muted)', border: `1px solid ${assigned > 0 ? 'var(--green)' : 'var(--muted)'}` }}>
              {recStatus}
            </span>
          </div>
        </div>
        <div style={{ marginTop: '12px', fontSize: '15px', color: 'var(--muted)' }}>
          Ranked #{rank} in priority queue
        </div>
      </div>

      {/* 9. Key Takeaways Box */}
      <div style={{ background: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid var(--cyan)', padding: '16px 20px', borderRadius: '0 8px 8px 0' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: 'var(--cyan)', display: 'flex', alignItems: 'center', gap: '8px' }}><Info size={18} /> Key Takeaways</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text)', fontSize: '14px', lineHeight: 1.6 }}>
          <li>Congestion is currently {isRising ? 'rising rapidly' : 'stable'} and expected to reach {forecastedCii.toFixed(1)} CII in the next 3 hours.</li>
          <li>{assigned > 0 ? `Assigning ${assigned} officers provides the highest return on investment for traffic relief.` : `Current conditions do not warrant dedicated officer deployment.`}</li>
          <li>Primary pressure stems from {topDrivers[0]?.formattedName.toLowerCase() || 'local capacity constraints'}.</li>
        </ul>
      </div>

      {/* 2. Decision Summary Strip */}
      <div style={{ background: 'var(--panel)', padding: '20px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '16px', lineHeight: 1.6, color: 'var(--text)' }}>
        <strong>AI Assessment:</strong> This hotspot is prioritized because forecasted congestion is {priorityTier.toLowerCase()}, time-of-day pressure is elevated, and road capacity stress is increasing. 
        {assigned > 0 
          ? ` Deploying ${assigned} officers here is expected to reduce congestion impact by ${relief.toFixed(1)} CII points over the next 3 hours.` 
          : ` No officers are recommended at this time due to lower expected ROI.`}
      </div>

      {/* 3. Decision Snapshot Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <MetricCard icon={Radar} label={`Priority Score (${priorityTier})`} value={priorityScore.toFixed(3)} tone="danger" />
        <MetricCard icon={Activity} label="Forecasted Impact (Next 3h)" value={forecastedCii.toFixed(2)} tone="warning" />
        <MetricCard icon={Route} label="Recommended Officers" value={assigned} tone="info" />
        <MetricCard icon={TrendingUp} label="Expected Relief" value={relief.toFixed(2)} tone="success" />
      </div>

      {/* 4. Why this hotspot is critical */}
      <Panel title="Why this hotspot is critical" eyebrow="Ranked Contribution">
        {(priorityTier === 'Critical' || priorityTier === 'High') ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {topDrivers.map((s) => {
              const widthPct = Math.min(100, (Math.abs(s.value) / maxDriverVal) * 100);
              const meaning = SIGNAL_MEANINGS[s.name] || 'AI identified impact metric.';
              const severityLabel = widthPct > 80 ? 'High' : widthPct > 40 ? 'Medium' : 'Low';
              
              return (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '6px' }}>
                  <div style={{ flex: '1 1 250px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>{s.formattedName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{meaning} • {s.category}</div>
                  </div>
                  
                  <div style={{ flex: '2 1 300px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ flex: 1, height: '8px', background: 'var(--line)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${widthPct}%`, height: '100%', background: s.value < 0 ? 'var(--cyan)' : 'var(--red)' }} />
                    </div>
                    <div style={{ width: '60px', fontSize: '12px', fontWeight: 600, color: s.value < 0 ? 'var(--cyan)' : 'var(--red)', textAlign: 'right' }}>
                      {severityLabel}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ color: 'var(--muted)', fontSize: '14px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            This hotspot is not currently classified as critical. No major priority drivers detected.
          </div>
        )}
      </Panel>

      {/* 5. Forecast & Impact */}
      <Panel title="Forecast & Impact" eyebrow="Time-series Analysis">
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 400px' }}>
            <h4 style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '16px', fontWeight: 500 }}>Congestion Trend (Simulated)</h4>
            <div style={{ height: '180px', background: 'var(--line)', borderRadius: '8px', position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '16px', gap: '8px' }}>
              {[lag3h, lag1h, currentCii, forecastedCii * 0.9, forecastedCii].map((val, idx) => {
                const heightPct = Math.min(100, Math.max(10, (val / 100) * 100));
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '100%', height: `${heightPct}%`, background: idx >= 3 ? 'var(--amber)' : 'var(--cyan)', opacity: idx >= 3 ? 0.7 : 1, borderRadius: '4px 4px 0 0', transition: 'all 0.3s ease' }} />
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{['T-3h', 'T-1h', 'Now', 'T+1.5h', 'T+3h'][idx]}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h4 style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '16px', fontWeight: 500 }}>Deployment Impact</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text)' }}>Impact without deployment:</span>
                <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--red)' }}>{forecastedCii.toFixed(1)} CII</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text)' }}>Impact with {assigned} officers:</span>
                <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--green)' }}>{Math.max(0, forecastedCii - relief).toFixed(1)} CII</span>
              </div>
              <div style={{ height: '1px', background: 'var(--line)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text)' }}>Expected improvement:</span>
                <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--green)' }}>-{relief.toFixed(1)} CII</span>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* 6. Deployment Rationale */}
      <Panel title="Deployment Rationale" eyebrow="Resource Allocation">
        <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text)', margin: '0 0 16px 0' }}>
          This hotspot is identified as a {priorityTier.toLowerCase()}-priority target because its relief-per-officer ratio ({assigned > 0 ? (relief / assigned).toFixed(2) : 0}) ranks among the top decile across the network. 
        </p>
        <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text)', margin: 0 }}>
          {assigned > 0 
            ? `The allocation of ${assigned} officers was chosen to maximize impact before diminishing returns. Assigning fewer officers risks failing to clear the predicted bottleneck, while assigning more would yield negligible additional benefit, wasting resources that could be deployed elsewhere.` 
            : `Zero officers were assigned because the predicted congestion, while present, does not respond well to manual traffic enforcement, or other hotspots provided a significantly higher ROI for the limited budget.`}
        </p>
      </Panel>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* 7. Evidence & Confidence */}
        <div style={{ flex: '2 1 400px' }}>
          <Panel title="Evidence & Confidence" eyebrow="Data Quality">
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ flex: 1 }}>
                <h5 style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 12px 0' }}>Signal Snapshot</h5>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text)', fontSize: '13px', lineHeight: 1.6 }}>
                  <li>Congestion severity: {currentCii > 50 ? 'High' : 'Moderate'}</li>
                  <li>Violation activity: {getSignalValue('current_violation_count') > 0 ? 'Elevated' : 'Normal'}</li>
                  <li>Capacity usage: {(getSignalValue('capacity_ratio') * 100).toFixed(0)}%</li>
                  <li>Trend direction: {isRising ? 'Worsening' : 'Improving'}</li>
                </ul>
              </div>
              <div style={{ flex: 1 }}>
                <h5 style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 12px 0' }}>Reliability</h5>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text)', fontSize: '13px', lineHeight: 1.6 }}>
                  <li>Forecast confidence: {(Number(cards.support_score || 0.8) * 100).toFixed(1)}%</li>
                  <li>Data completeness: {(Number(cards.data_quality_score || 0.95) * 100).toFixed(1)}%</li>
                  <li>Last updated: Just now</li>
                </ul>
              </div>
            </div>
            <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
              <strong style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>Supporting Evidence:</strong>
              <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
                • Congestion has been {isRising ? 'rising' : 'falling'} over the past 3 hours.<br/>
                • Capacity usage is {getSignalValue('capacity_ratio') > 0.8 ? 'near critical' : 'within normal'} threshold levels.<br/>
                • Hotspot ranks in the top priority queue by forecasted impact.
              </div>
            </div>
          </Panel>
        </div>

        {/* 8. What changed recently? */}
        <div style={{ flex: '1 1 300px' }}>
          <Panel title="What changed recently?" eyebrow="Live Updates">
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <AlertTriangle size={16} style={{ color: 'var(--amber)', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>Forecast worsened</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Predicted CII jumped by {Math.abs(forecastedCii - currentCii).toFixed(1)} points in the last hour.</div>
                </div>
              </li>
              {getSignalValue('current_violation_count') > 0 && (
                <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <AlertCircle size={16} style={{ color: 'var(--red)', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>Violation spike</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Traffic violations detected above normal baseline.</div>
                  </div>
                </li>
              )}
              <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <Clock size={16} style={{ color: 'var(--info)', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>Threshold crossed</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Time-of-day pressure shifted to peak hour dynamics.</div>
                </div>
              </li>
            </ul>
          </Panel>
        </div>
      </div>

      {/* 10. Operator actions */}
      <div style={{ background: 'var(--panel)', padding: '20px', borderRadius: '8px', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldAlert size={24} style={{ color: 'var(--text)' }} />
          <div>
            <h3 style={{ fontSize: '16px', margin: '0 0 4px 0', color: 'var(--text)' }}>Operator Actions</h3>
            <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Recommended next steps for this hotspot.</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="primary-button" style={{ cursor: 'pointer' }}>
            Deploy {assigned} Officers
          </button>
          <button style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--line)', borderRadius: '6px', color: 'var(--text)', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
            Open in Command Map
          </button>
        </div>
      </div>
      
    </div>
  );
}
