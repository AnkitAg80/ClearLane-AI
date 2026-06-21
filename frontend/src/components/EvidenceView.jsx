import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Clock,
  Database,
  LineChart,
  Map,
  ShieldCheck,
  Target,
} from 'lucide-react';
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

  const model = evidence?.model || {};
  const features = evidence?.feature_importance || {};

  const forecastGroups = processFeatures(features.regression);
  const rankerGroups = processFeatures(features.ranker);

  return (
    <div className="view-stack" style={{ gap: '24px' }}>
      {/* Section 1: Evidence Summary Strip */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(2, 6, 23, 0.4) 100%)', 
        border: '1px solid rgba(6, 182, 212, 0.3)', 
        borderRadius: '12px', 
        padding: '24px', 
        display: 'flex', 
        gap: '20px', 
        alignItems: 'flex-start',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }} />
        <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '12px', borderRadius: '12px', zIndex: 1, flexShrink: 0 }}>
          <ShieldCheck size={32} style={{ color: 'var(--cyan)' }} />
        </div>
        <div style={{ zIndex: 1 }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text)', letterSpacing: '-0.02em' }}>System Verification Console</h2>
          <p style={{ margin: 0, fontSize: '15px', color: 'var(--muted)', lineHeight: 1.6, maxWidth: '800px' }}>
            The current recommendation system uses <strong style={{ color: 'var(--text)' }}>{(model.features || []).length || 51} traffic and operational signals</strong> across monitored city cells. Recent congestion history and road capacity stress are the strongest drivers of both forecasting and hotspot ranking. Current data inputs are healthy and recently refreshed.
          </p>
        </div>
      </div>

      {/* Section 3: How recommendations are generated */}
      <Panel title="How recommendations are generated" eyebrow="System Workflow">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '16px 0' }}>
          {[
            { step: 1, title: 'Collect Signals', desc: 'Traffic, capacity & violations', icon: Database },
            { step: 2, title: 'Forecast Congestion', desc: 'Predict next-3-hour impact', icon: LineChart },
            { step: 3, title: 'Rank Hotspots', desc: 'Prioritize by urgency & relief', icon: Target },
            { step: 4, title: 'Optimize Deployment', desc: 'Allocate officers efficiently', icon: Map }
          ].map((item, idx) => {
            const IconComp = item.icon;
            return (
            <div key={item.step} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ 
                flex: 1, 
                background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)', 
                border: '1px solid var(--line)', 
                borderRadius: '12px', 
                padding: '20px', 
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--cyan)', opacity: 0.5 }} />
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                  <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '10px', borderRadius: '50%' }}>
                    <IconComp size={24} style={{ color: 'var(--cyan)' }} />
                  </div>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1px', color: 'var(--cyan)', marginBottom: '8px', textTransform: 'uppercase' }}>STEP {item.step}</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>{item.title}</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.4 }}>{item.desc}</div>
              </div>
              {idx < 3 && <div style={{ color: 'var(--line-strong)', margin: '0 16px', flexShrink: 0, display: 'flex', alignItems: 'center' }}><ArrowRight size={24} /></div>}
            </div>
            );
          })}
        </div>
      </Panel>

      {/* Section 4: What the system looks at */}
      <Panel title="What the system looks at" eyebrow="Evidence Categories">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[
            { title: 'Congestion history', desc: 'Recent traffic flow trends and historical averages.', icon: Activity, color: 'var(--cyan)' },
            { title: 'Capacity / flow stress', desc: 'Volume of vehicles relative to maximum road limits.', icon: Database, color: 'var(--amber)' },
            { title: 'Traffic disruption activity', desc: 'Reported violations, accidents, and blockages.', icon: AlertTriangle, color: 'var(--red)' },
            { title: 'Spatial hotspot context', desc: 'Congestion spilling over from neighboring areas.', icon: Map, color: 'var(--indigo, #818cf8)' },
            { title: 'Time-of-day pattern', desc: 'Recurring rush hour and weekly traffic cycles.', icon: Clock, color: 'var(--pink, #f472b6)' }
          ].map((cat, idx) => {
            const IconComp = cat.icon;
            return (
            <div key={idx} style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', borderRadius: '8px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                   <IconComp size={18} style={{ color: cat.color }} />
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{cat.title}</div>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>{cat.desc}</div>
            </div>
            );
          })}
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
                <div style={{ flex: 1, height: '10px', background: 'var(--line)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${g.percentage}%`, height: '100%', background: 'linear-gradient(90deg, var(--cyan) 0%, #38bdf8 100%)', borderRadius: '6px', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
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
        {/* Section 6: Core AI Architecture */}
        <Panel title="Core AI Architecture" eyebrow="Active Components">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { name: 'Live Congestion Input', desc: 'Real-time traffic sensor ingestion and processing.', icon: Activity, color: 'var(--cyan)' },
              { name: 'Forecast Engine', desc: 'Generates predictive next-3-hour impact models.', icon: LineChart, color: 'var(--amber)' },
              { name: 'Hotspot Ranking Engine', desc: 'Sorts problematic areas by urgency and expected ROI.', icon: Target, color: 'var(--red)' },
              { name: 'Deployment Optimizer', desc: 'Allocates officer budget across priority zones.', icon: Map, color: 'var(--green)' },
              { name: 'Evaluation Metrics Store', desc: 'Tracks historical accuracy and model drift.', icon: Database, color: 'var(--muted)' },
            ].map((comp, idx) => {
              const IconComp = comp.icon;
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', border: '1px solid var(--line)', borderRadius: '8px', background: 'var(--panel-2)' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', display: 'flex', border: '1px solid var(--line)' }}>
                    <IconComp size={20} style={{ color: comp.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>{comp.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.4 }}>{comp.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* Section 7: Known limitations and trust guidance */}
        <Panel title="Trust Guidance" eyebrow="System Capabilities">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: 'linear-gradient(90deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.02) 100%)', borderLeft: '4px solid var(--green)', borderTop: '1px solid rgba(34, 197, 94, 0.2)', borderRight: '1px solid rgba(34, 197, 94, 0.2)', borderBottom: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '0 8px 8px 0', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--green)', fontWeight: 700, marginBottom: '12px', fontSize: '15px' }}>
                <ShieldCheck size={20} /> When to trust recommendations most
              </div>
              <ul style={{ margin: 0, paddingLeft: '28px', fontSize: '14px', color: 'var(--text)', lineHeight: 1.6 }}>
                <li style={{ marginBottom: '8px' }}>When recent continuous congestion data is fully available.</li>
                <li style={{ marginBottom: '8px' }}>In regularly monitored, high-density urban corridors.</li>
                <li>For short-term deployment planning rather than long-term forecasting.</li>
              </ul>
            </div>

            <div style={{ background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.02) 100%)', borderLeft: '4px solid var(--red)', borderTop: '1px solid rgba(239, 68, 68, 0.2)', borderRight: '1px solid rgba(239, 68, 68, 0.2)', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '0 8px 8px 0', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--red)', fontWeight: 700, marginBottom: '12px', fontSize: '15px' }}>
                <AlertTriangle size={20} /> Known limitations
              </div>
              <ul style={{ margin: 0, paddingLeft: '28px', fontSize: '14px', color: 'var(--text)', lineHeight: 1.6 }}>
                <li style={{ marginBottom: '8px' }}>Weaker forecasts in sparse or low-signal residential areas.</li>
                <li style={{ marginBottom: '8px' }}>Violation data may underrepresent unreported traffic disruptions.</li>
                <li>Expected traffic relief estimates are modeled, not directly observed.</li>
              </ul>
            </div>
          </div>
        </Panel>
      </div>

    </div>
  );
}
