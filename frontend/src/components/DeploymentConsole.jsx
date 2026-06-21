import { useState } from 'react';
import { ShieldAlert, TrendingUp, Crosshair, Users, ActivitySquare, CheckCircle, SlidersHorizontal } from 'lucide-react';
import MetricCard from './MetricCard';

export default function DeploymentConsole({ overview, deployment, onOptimize, isLoading }) {
  const summary = overview?.summary || {};
  const highlights = overview?.highlights || {};
  const totals = deployment?.totals || {};
  const reactive = deployment?.reactive || [];
  const optimized = deployment?.optimized || [];
  
  const [budget, setBudget] = useState(summary.officers_deployed || 100);
  const [mode, setMode] = useState('optimized'); // 'optimized', 'reactive', 'manual'

  // Calculations for Marginal Benefit & dynamic text
  const currentRelief = summary.expected_relief || 0;
  const currentOfficers = summary.officers_deployed || 100;
  
  // Simplistic diminishing return model
  const simulateRelief = (newBudget) => {
    if (currentOfficers === 0) return 0;
    const ratio = newBudget / currentOfficers;
    const predicted = currentRelief * Math.pow(ratio, 0.75); 
    return predicted;
  };

  const predictedRelief = simulateRelief(budget);
  const diffPct = currentRelief ? ((predictedRelief - currentRelief) / currentRelief) * 100 : 0;
  
  let supportText = "Optimized deployment ready.";
  if (budget < currentOfficers) {
    supportText = `Reducing to ${budget} officers may lower relief by ${Math.abs(diffPct).toFixed(1)}%.`;
  } else if (budget > currentOfficers) {
    supportText = `Increasing to ${budget} officers adds approximately +${Math.abs(diffPct).toFixed(1)}% more relief.`;
  }

  const handleApply = () => {
    onOptimize(budget);
  };
  const handleReset = () => {
    setBudget(100);
  };

  // Plan Comparison Data
  const reactiveTotalOfficers = totals.reactive_officers || 0;
  const reactiveTotalRelief = totals.reactive_relief || 0;
  const reactiveHotspots = reactive.filter(r => r.officers_assigned > 0).length;
  
  const optTotalOfficers = totals.optimized_officers || 0;
  const optTotalRelief = totals.optimized_relief || 0;
  const optHotspots = optimized.filter(r => r.officers_assigned > 0).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
      
      {/* Row 1: Section A (Optimizer) and Section B (Outcome) */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* Section A: Deployment Optimizer */}
        <div className="panel" style={{ flex: '1 1 350px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={18} style={{ color: 'var(--cyan)' }} /> Deployment Optimizer
          </h3>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '13px' }}>
              <span style={{ color: 'var(--muted)' }}>Assigned Officers</span>
              <input 
                type="number" 
                value={budget} 
                onChange={(e) => setBudget(e.target.value === '' ? '' : Number(e.target.value))} 
                style={{ 
                  width: '64px', 
                  background: 'rgba(15, 23, 42, 0.78)', 
                  border: '1px solid var(--line)', 
                  borderRadius: '6px',
                  color: 'var(--green)', 
                  padding: '4px 6px',
                  fontSize: '15px',
                  fontWeight: '600',
                  textAlign: 'center',
                  fontFamily: "'Fira Code', monospace"
                }}
                disabled={isLoading}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                className="icon-button" 
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--line)', border: 'none', color: 'var(--text)' }} 
                onClick={() => setBudget(b => Math.max(10, b - 10))} 
                disabled={isLoading}
              >
                -
              </button>
              <input 
                type="range" 
                min="10" max="500" step="10" 
                value={budget} 
                onChange={e => setBudget(Number(e.target.value))} 
                style={{ flex: 1, accentColor: 'var(--green)', cursor: 'pointer' }}
                disabled={isLoading}
              />
              <button 
                className="icon-button" 
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--line)', border: 'none', color: 'var(--text)' }} 
                onClick={() => setBudget(b => Math.min(500, b + 10))} 
                disabled={isLoading}
              >
                +
              </button>
            </div>
            
            <div style={{ marginTop: '16px', padding: '10px 14px', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '6px', fontSize: '13px', color: 'var(--green)', lineHeight: 1.4 }}>
              {supportText}
            </div>
          </div>

          <div className="segmented" style={{ width: '100%', marginBottom: '20px' }}>
             <button type="button" className={mode === 'optimized' ? 'is-active' : ''} onClick={() => setMode('optimized')} style={{ flex: 1 }}>AI Optimized</button>
             <button type="button" className={mode === 'reactive' ? 'is-active' : ''} onClick={() => setMode('reactive')} style={{ flex: 1 }}>Reactive Base</button>
             <button type="button" className={mode === 'manual' ? 'is-active' : ''} onClick={() => setMode('manual')} style={{ flex: 1 }}>Manual</button>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
            <button className="primary-button" style={{ flex: 1 }} onClick={handleApply} disabled={isLoading || budget === currentOfficers}>
              {isLoading ? 'Optimizing...' : 'Apply to Top Hotspots'}
            </button>
            <button type="button" style={{ padding: '0 14px', background: 'transparent', border: '1px solid var(--line)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', fontWeight: 500 }} onClick={handleReset} disabled={isLoading}>
              Reset
            </button>
          </div>
        </div>

        {/* Section B: Outcome Summary */}
        <div style={{ flex: '2 1 500px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
          <MetricCard icon={Users} label="Officers Deployed" value={summary.officers_deployed ?? 0} tone="info" tooltip="Total number of police personnel allocated to active hotspots." />
          <MetricCard icon={TrendingUp} label="Expected Traffic Relief" value={Number(summary.expected_relief || 0).toFixed(2)} tone="success" tooltip="Predicted reduction in traffic congestion across all optimized hotspots." />
          <MetricCard icon={ShieldAlert} label="Lift vs Reactive Baseline" value={`${Number(highlights.lift_pct || 0).toFixed(1)}%`} tone="warning" tooltip="Percentage improvement in congestion relief over a reactive baseline strategy." />
          <MetricCard icon={ActivitySquare} label="Critical Hotspots Covered" value={summary.active_cells ?? 0} tone="danger" tooltip="Total number of critical priority areas assigned at least one officer." />
        </div>
      </div>

      {/* Row 2: Section C (Plan Comparison) */}
      <div className="panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0', color: 'var(--text)' }}>Plan Comparison</h3>
        <div className="table-wrap">
          <table className="data-table" style={{ width: '100%', minWidth: '600px' }}>
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Metric</th>
                <th style={{ width: '25%' }} title="Historical reactive assignments based on typical past behavior.">Reactive Baseline</th>
                <th style={{ width: '25%' }} title="AI-recommended optimal deployment strategy using real-time predictions.">AI Optimized Plan</th>
                <th style={{ width: '25%' }} title="Currently selected budget allocation on the slider.">Current / Selected</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ color: 'var(--muted)', cursor: 'default' }} title="Total number of police personnel allocated.">Officers Deployed</td>
                <td>{reactiveTotalOfficers}</td>
                <td style={{ color: 'var(--green)', fontWeight: 600 }}>{optTotalOfficers}</td>
                <td style={{ color: budget !== optTotalOfficers ? 'var(--amber)' : 'inherit' }}>{budget} <small style={{ display: 'inline', color: 'var(--muted)' }}>(simulated)</small></td>
              </tr>
              <tr>
                <td style={{ color: 'var(--muted)', cursor: 'default' }} title="Predicted reduction in traffic congestion.">Expected Relief</td>
                <td>{reactiveTotalRelief.toFixed(2)}</td>
                <td style={{ color: 'var(--green)', fontWeight: 600 }}>{optTotalRelief.toFixed(2)}</td>
                <td style={{ color: budget !== optTotalOfficers ? 'var(--amber)' : 'inherit' }}>{predictedRelief.toFixed(2)}</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--muted)', cursor: 'default' }} title="Number of critical priority areas assigned at least one officer.">Hotspots Covered</td>
                <td>{reactiveHotspots}</td>
                <td style={{ color: 'var(--green)', fontWeight: 600 }}>{optHotspots}</td>
                <td style={{ color: 'var(--muted)' }}>-</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--muted)', cursor: 'default' }} title="Average congestion relief achieved per deployed officer (ROI indicator).">Relief per Officer</td>
                <td>{reactiveTotalOfficers ? (reactiveTotalRelief / reactiveTotalOfficers).toFixed(2) : 0}</td>
                <td style={{ color: 'var(--green)', fontWeight: 600 }}>{optTotalOfficers ? (optTotalRelief / optTotalOfficers).toFixed(2) : 0}</td>
                <td style={{ color: budget !== optTotalOfficers ? 'var(--amber)' : 'inherit' }}>{budget ? (predictedRelief / budget).toFixed(2) : 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 3: Section D (Recommendation Summary Strip & Marginal Benefit Chart) */}
      <div style={{ background: 'linear-gradient(to right, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.02))', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '20px 24px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        <CheckCircle size={32} style={{ color: 'var(--green)', flexShrink: 0 }} />
        
        <div style={{ flex: '1 1 300px', fontSize: '16px', color: 'var(--text)', lineHeight: '1.6' }}>
          <strong>AI recommends deploying {optTotalOfficers} officers across {optHotspots} critical hotspots</strong> for 
          <span style={{ color: 'var(--green)', fontWeight: 600 }}> {optTotalRelief.toFixed(1)} expected relief </span> 
          over the next 3 hours, outperforming the reactive baseline by <span style={{ color: 'var(--amber)', fontWeight: 600 }}>{Number(highlights.lift_pct || 0).toFixed(1)}%</span>.
        </div>
        
        {/* Marginal Benefit Mini Chart */}
        <div style={{ flexShrink: 0, width: '180px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Marginal Benefit Curve</div>
          <div style={{ width: '100%', height: '48px', display: 'flex', alignItems: 'flex-end', gap: '2px', opacity: 0.9 }}>
            {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(val => {
              const ratio = val / 100;
              const h = Math.pow(ratio, 0.75) * 100;
              const barBudget = (val / 100) * 500;
              const isSelected = Math.abs(budget - barBudget) < 25;
              
              return (
                <div 
                  key={val} 
                  style={{ 
                    flex: 1, 
                    height: `${h}%`, 
                    background: isSelected ? 'var(--cyan)' : (val === 100 ? 'var(--green)' : 'var(--line-strong)'), 
                    borderRadius: '2px 2px 0 0',
                    transition: 'all 0.2s ease'
                  }} 
                  title={`Simulated relief at ~${barBudget.toFixed(0)} officers`}
                />
              );
            })}
          </div>
        </div>
      </div>
      
    </div>
  );
}
