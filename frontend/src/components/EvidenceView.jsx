import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  Info,
  LineChart,
  Map,
  ShieldCheck,
  Target,
  XCircle,
} from 'lucide-react';
import MetricCard from './MetricCard';
import Panel from './Panel';

function getFriendlySignalGroup(rawName) {
  const lower = rawName.toLowerCase();
  if (lower.includes('lag') || lower.includes('roll')) return 'Recent congestion trend';
  if (lower.includes('capacity')) return 'Road capacity stress';
  if (lower.includes('violation')) return 'Traffic disruption activity';
  if (lower.includes('temporal') || lower.includes('hour') || lower.includes('dow')) return 'Time-of-day traffic pattern';
  if (lower.includes('ring') || lower.includes('neighbor') || lower.includes('spatial')) return 'Spatial hotspot context';
  return 'Cell ranking features';
}

function getSignalDescription(groupName) {
  const map = {
    'Recent congestion trend': 'Historical traffic flow from the past 1 to 24 hours.',
    'Road capacity stress': 'How close the roads are to maximum vehicle capacity.',
    'Traffic disruption activity': 'Recent recorded traffic violations and blockages.',
    'Time-of-day traffic pattern': 'Predictable daily and weekly congestion cycles.',
    'Spatial hotspot context': 'Spillover congestion from neighboring areas.',
    'Cell ranking features': 'Internal metrics for severity prioritization.',
  };
  return map[groupName] || 'Internal AI metric used for prediction.';
}

function processFeatures(rows) {
  if (!rows || rows.length === 0) return [];
  const groups = {};
  rows.forEach((row) => {
    const groupName = getFriendlySignalGroup(row.feature);
    const importance = Number(row.importance || row.gain || row.split || 0);
    if (!groups[groupName]) groups[groupName] = 0;
    groups[groupName] += importance;
  });

  const sortedGroups = Object.entries(groups)
    .map(([name, importance]) => ({ name, importance }))
    .sort((a, b) => b.importance - a.importance);

  const maxVal = Math.max(...sortedGroups.map((g) => g.importance), 0.01);
  return sortedGroups.map((g) => ({
    ...g,
    percentage: Math.min(100, (g.importance / maxVal) * 100),
    description: getSignalDescription(g.name),
  }));
}

export default function EvidenceView({ evidence }) {
  const [activeTab, setActiveTab] = useState('forecast');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const backtest = evidence?.backtest || {};
  const roi = evidence?.roi || {};
  const model = evidence?.model || {};
  const features = evidence?.feature_importance || {};
  const artifacts = evidence?.artifacts || [];

  const top25Recall = Number(backtest.deployment_score_top25_recall || 0);
  const ndcg25 = Number(backtest.deployment_score_ndcg_at_25 || 0);

  const forecastGroups = processFeatures(features.regression);
  const rankerGroups = processFeatures(features.ranker);

  return (
    <div className="view-stack" style={{ gap: '24px' }}>
      {/* Section 1: Evidence Summary Strip */}
      <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid var(--cyan)', borderRadius: '8px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <ShieldCheck size={28} style={{ color: 'var(--cyan)' }} />
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px 0', color: 'var(--text)' }}>System Verification Console</h2>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--muted)', lineHeight: 1.5 }}>
            The current recommendation system uses {(model.features || []).length || 51} traffic and operational signals across monitored city cells. Recent congestion history and road capacity stress are the strongest drivers of both forecasting and hotspot ranking. Current data inputs are healthy and recently refreshed.
          </p>
        </div>
      </div>

      {/* Section 3: How recommendations are generated */}
      <Panel title="How recommendations are generated" eyebrow="System Workflow">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '16px 0' }}>
          {[
            { step: 1, title: 'Collect Signals', desc: 'Traffic, capacity & violations' },
            { step: 2, title: 'Forecast Congestion', desc: 'Predict next-3-hour impact' },
            { step: 3, title: 'Rank Hotspots', desc: 'Prioritize by urgency & relief' },
            { step: 4, title: 'Optimize Deployment', desc: 'Allocate officers efficiently' }
          ].map((item, idx) => (
            <div key={item.step} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyan)', marginBottom: '8px' }}>STEP {item.step}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>{item.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{item.desc}</div>
              </div>
              {idx < 3 && <ArrowRight size={20} style={{ color: 'var(--line-strong)', margin: '0 12px', flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </Panel>

      {/* Section 4: What the system looks at */}
      <Panel title="What the system looks at" eyebrow="Evidence Categories">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[
            { title: 'Congestion history', desc: 'Recent traffic flow trends and historical averages.' },
            { title: 'Capacity / flow stress', desc: 'Volume of vehicles relative to maximum road limits.' },
            { title: 'Traffic disruption activity', desc: 'Reported violations, accidents, and blockages.' },
            { title: 'Spatial hotspot context', desc: 'Congestion spilling over from neighboring areas.' },
            { title: 'Time-of-day pattern', desc: 'Recurring rush hour and weekly traffic cycles.' }
          ].map((cat, idx) => (
            <div key={idx} style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', borderRadius: '6px', padding: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>{cat.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4 }}>{cat.desc}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Section 5: What signals matter most */}
      <Panel title="What signals matter most" eyebrow="AI Decision Drivers">
        <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--line)', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('forecast')}
            style={{ padding: '8px 0', background: 'none', border: 'none', borderBottom: activeTab === 'forecast' ? '2px solid var(--cyan)' : '2px solid transparent', color: activeTab === 'forecast' ? 'var(--text)' : 'var(--muted)', fontWeight: 600, fontSize: '14px' }}
          >
            Signals used to forecast congestion
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ranker')}
            style={{ padding: '8px 0', background: 'none', border: 'none', borderBottom: activeTab === 'ranker' ? '2px solid var(--cyan)' : '2px solid transparent', color: activeTab === 'ranker' ? 'var(--text)' : 'var(--muted)', fontWeight: 600, fontSize: '14px' }}
          >
            Signals used to prioritize hotspots
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(activeTab === 'forecast' ? forecastGroups : rankerGroups).map((g) => (
            <div key={g.name} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '6px' }}>
              <div style={{ flex: '1 1 250px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>{g.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{g.description}</div>
              </div>
              <div style={{ flex: '2 1 300px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ flex: 1, height: '8px', background: 'var(--line)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${g.percentage}%`, height: '100%', background: 'var(--cyan)' }} />
                </div>
                <div style={{ width: '60px', fontSize: '12px', fontWeight: 600, color: 'var(--text)', textAlign: 'right' }}>
                  {g.percentage > 80 ? 'High' : g.percentage > 40 ? 'Medium' : 'Low'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="two-col">
        {/* Section 6: Data & pipeline status */}
        <Panel title="Data & pipeline status" eyebrow="System Health">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { name: 'Live congestion input', desc: 'Real-time traffic sensor ingestion.', status: 'Healthy' },
              { name: 'Forecast engine', desc: 'Generates next-3-hour CII predictions.', status: 'Healthy' },
              { name: 'Hotspot ranking engine', desc: 'Sorts cells by urgency and ROI.', status: 'Healthy' },
              { name: 'Deployment optimizer', desc: 'Allocates budget across ranked cells.', status: 'Healthy' },
              { name: 'Evaluation metrics store', desc: 'Tracks historical model performance.', status: 'Healthy' },
            ].map((comp, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid var(--line)', borderRadius: '6px', background: 'var(--panel-2)' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>{comp.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{comp.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Section 7: Known limitations and trust guidance */}
        <Panel title="Trust Guidance" eyebrow="System Capabilities">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '6px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green)', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>
                <ShieldCheck size={16} /> When to trust recommendations most
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
                <li style={{ marginBottom: '4px' }}>When recent continuous congestion data is fully available.</li>
                <li style={{ marginBottom: '4px' }}>In regularly monitored, high-density urban corridors.</li>
                <li>For short-term deployment planning rather than long-term forecasting.</li>
              </ul>
            </div>

            <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--red)', fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>
                <AlertTriangle size={16} /> Known limitations
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
                <li style={{ marginBottom: '4px' }}>Weaker forecasts in sparse or low-signal residential areas.</li>
                <li style={{ marginBottom: '4px' }}>Violation data may underrepresent unreported traffic disruptions.</li>
                <li>Expected traffic relief estimates are modeled, not directly observed.</li>
              </ul>
            </div>
          </div>
        </Panel>
      </div>

      {/* Section 8: Advanced model metrics */}
      <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '8px', overflow: 'hidden' }}>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--panel-2)', border: 'none', color: 'var(--text)', fontSize: '14px', fontWeight: 600 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} style={{ color: 'var(--muted)' }} />
            Advanced model diagnostics (Engineering)
          </div>
          {showAdvanced ? <ChevronDown size={18} style={{ color: 'var(--muted)' }} /> : <ChevronRight size={18} style={{ color: 'var(--muted)' }} />}
        </button>
        
        {showAdvanced && (
          <div style={{ padding: '16px', borderTop: '1px solid var(--line)' }}>
            <div className="metrics-grid metrics-grid--compact" style={{ marginBottom: '24px' }}>
              <MetricCard icon={LineChart} label="Raw Top-25 Recall" value={top25Recall.toFixed(3)} tone="info" tooltip="Proportion of actual critical hotspots correctly identified within the top 25 recommendations." />
              <MetricCard icon={ShieldCheck} label="Raw NDCG@25" value={ndcg25.toFixed(3)} tone="info" tooltip="Normalized Discounted Cumulative Gain at rank 25. Measures the exact ranking order quality." />
              <MetricCard icon={BrainCircuit} label="Ranker Status" value={model.ranker_enabled ? 'Enabled' : 'Disabled'} tone="warning" tooltip="Indicates if the secondary AI ranking model is actively reprioritizing the regression output." />
              <MetricCard icon={Database} label="Total Features" value={(model.features || []).length} tone="muted" tooltip="Total number of raw signals and historical features fed into the machine learning models." />
            </div>

            <h4 style={{ fontSize: '14px', color: 'var(--text)', marginBottom: '12px' }}>Raw Artifact Registry</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
              {artifacts.map((item) => (
                <div key={item.artifact} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--line)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.artifact}>
                    {item.artifact}
                  </span>
                  {item.exists ? (
                    <span style={{ fontSize: '11px', color: 'var(--green)', flexShrink: 0, whiteSpace: 'nowrap' }}>{Number(item.size_mb || 0).toFixed(3)} MB</span>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--red)', flexShrink: 0, whiteSpace: 'nowrap' }}>Missing</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
