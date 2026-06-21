import { useEffect, useMemo, useState } from 'react';
import { ActivitySquare, CheckCircle, SlidersHorizontal, TrendingUp, Users, ShieldAlert } from 'lucide-react';
import MetricCard from './MetricCard';

function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function estimateReliefForBudget(currentRelief, currentOfficers, selectedBudget) {
  if (currentOfficers <= 0 || selectedBudget <= 0) return 0;
  const ratio = selectedBudget / currentOfficers;
  return currentRelief * Math.pow(ratio, 0.75);
}

export default function DeploymentConsole({ overview, deployment, onOptimize, isLoading }) {
  const summary = overview?.summary || {};
  const highlights = overview?.highlights || {};
  const totals = deployment?.totals || {};
  const reactive = deployment?.reactive || [];
  const optimized = deployment?.optimized || [];

  const currentOfficers = asNumber(summary.officers_deployed, 100);
  const currentRelief = asNumber(summary.expected_relief, 0);
  const [budget, setBudget] = useState(currentOfficers || 100);

  useEffect(() => {
    setBudget(currentOfficers || 100);
  }, [currentOfficers]);

  const numericBudget = Math.max(0, asNumber(budget, 0));
  const sliderMax = Math.max(500, currentOfficers * 2, numericBudget);
  const selectedRelief = estimateReliefForBudget(currentRelief, currentOfficers, numericBudget);
  const reliefDelta = selectedRelief - currentRelief;

  const reactiveTotalOfficers = asNumber(totals.reactive_officers, 0);
  const reactiveTotalRelief = asNumber(totals.reactive_relief, 0);
  const reactivePlaces = reactive.filter((row) => Number(row.officers_assigned) > 0).length;

  const optimizedTotalOfficers = asNumber(totals.optimized_officers, 0);
  const optimizedTotalRelief = asNumber(totals.optimized_relief, 0);
  const optimizedPlaces = optimized.filter((row) => Number(row.officers_assigned) > 0).length;

  const setBudgetSafe = (next) => {
    const value = Math.max(0, Math.round(asNumber(next, 0)));
    setBudget(value);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div className="panel" style={{ flex: '1 1 350px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={18} style={{ color: 'var(--cyan)' }} /> Deployment Optimizer
          </h3>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '13px' }}>
              <span style={{ color: 'var(--muted)' }}>Assigned Officers</span>
              <input
                type="number"
                min="0"
                step="10"
                value={budget}
                onChange={(event) => setBudgetSafe(event.target.value)}
                style={{
                  width: '84px',
                  background: 'rgba(15, 23, 42, 0.78)',
                  border: '1px solid var(--line)',
                  borderRadius: '6px',
                  color: 'var(--green)',
                  padding: '4px 6px',
                  fontSize: '15px',
                  fontWeight: '600',
                  textAlign: 'center',
                  fontFamily: "'Fira Code', monospace",
                }}
                disabled={isLoading}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                className="icon-button"
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--line)', border: 'none', color: 'var(--text)' }}
                onClick={() => setBudgetSafe(numericBudget - 10)}
                disabled={isLoading}
                aria-label="Decrease assigned officers"
              >
                -
              </button>
              <input
                type="range"
                min="0"
                max={sliderMax}
                step="10"
                value={numericBudget}
                onChange={(event) => setBudgetSafe(event.target.value)}
                style={{ flex: 1, accentColor: 'var(--green)', cursor: 'pointer' }}
                disabled={isLoading}
              />
              <button
                className="icon-button"
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--line)', border: 'none', color: 'var(--text)' }}
                onClick={() => setBudgetSafe(numericBudget + 10)}
                disabled={isLoading}
                aria-label="Increase assigned officers"
              >
                +
              </button>
            </div>

            <div style={{ marginTop: '16px', padding: '10px 14px', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '6px', fontSize: '13px', color: 'var(--green)', lineHeight: 1.4 }}>
              {numericBudget === currentOfficers
                ? 'Current optimized deployment is loaded.'
                : `${numericBudget} officers projects ${selectedRelief.toFixed(2)} CII relief, ${reliefDelta >= 0 ? '+' : ''}${reliefDelta.toFixed(2)} versus the current plan.`}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
            <button className="primary-button" style={{ flex: 1 }} onClick={() => onOptimize(numericBudget)} disabled={isLoading || numericBudget === currentOfficers}>
              {isLoading ? 'Optimizing...' : 'Optimize Deployment'}
            </button>
            <button type="button" style={{ padding: '0 14px', background: 'transparent', border: '1px solid var(--line)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', fontWeight: 500 }} onClick={() => setBudgetSafe(currentOfficers || 100)} disabled={isLoading}>
              Reset
            </button>
          </div>
        </div>

        <div style={{ flex: '2 1 500px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
          <MetricCard icon={Users} label="Officers Deployed" value={summary.officers_deployed ?? 0} tone="info" tooltip="Total number of police personnel allocated to deployed places." />
          <MetricCard icon={TrendingUp} label="Expected CII Relief" value={Number(summary.expected_relief || 0).toFixed(2)} sublabel="CII reduction units" tone="success" tooltip="Estimated Congestion Impact Index reduction across deployed places. This is not a percentage." />
          <MetricCard icon={ShieldAlert} label="Lift vs Reactive Baseline" value={`${Number(highlights.lift_pct || 0).toFixed(1)}%`} tone="warning" tooltip="Percentage improvement in CII relief over a reactive baseline strategy." />
          <MetricCard icon={ActivitySquare} label="Deployed Places Covered" value={summary.active_cells ?? 0} tone="danger" tooltip="Number of places assigned at least one officer." />
        </div>
      </div>

      <div className="panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px 0', color: 'var(--text)' }}>Plan Comparison</h3>
        <div className="table-wrap">
          <table className="data-table" style={{ width: '100%', minWidth: '600px' }}>
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Metric</th>
                <th style={{ width: '25%' }} title="Historical reactive assignments based on current violation pressure.">Reactive Baseline</th>
                <th style={{ width: '25%' }} title="AI-recommended allocation using forecast and relief estimates.">AI Optimized Plan</th>
                <th style={{ width: '25%' }} title="Projected values for the selected officer budget before applying it.">Selected Budget Projection</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ color: 'var(--muted)', cursor: 'default' }} title="Total number of police personnel allocated.">Officers Deployed</td>
                <td>{reactiveTotalOfficers}</td>
                <td style={{ color: 'var(--green)', fontWeight: 600 }}>{optimizedTotalOfficers}</td>
                <td style={{ color: numericBudget !== optimizedTotalOfficers ? 'var(--amber)' : 'inherit' }}>{numericBudget}</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--muted)', cursor: 'default' }} title="Estimated CII reduction units.">Expected CII Relief</td>
                <td>{reactiveTotalRelief.toFixed(2)}</td>
                <td style={{ color: 'var(--green)', fontWeight: 600 }}>{optimizedTotalRelief.toFixed(2)}</td>
                <td style={{ color: numericBudget !== optimizedTotalOfficers ? 'var(--amber)' : 'inherit' }}>{selectedRelief.toFixed(2)}</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--muted)', cursor: 'default' }} title="Number of places assigned at least one officer.">Deployed Places Covered</td>
                <td>{reactivePlaces}</td>
                <td style={{ color: 'var(--green)', fontWeight: 600 }}>{optimizedPlaces}</td>
                <td style={{ color: 'var(--muted)' }}>computed after optimize</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--muted)', cursor: 'default' }} title="Average CII relief achieved per deployed officer.">CII Relief per Officer</td>
                <td>{reactiveTotalOfficers ? (reactiveTotalRelief / reactiveTotalOfficers).toFixed(2) : 0}</td>
                <td style={{ color: 'var(--green)', fontWeight: 600 }}>{optimizedTotalOfficers ? (optimizedTotalRelief / optimizedTotalOfficers).toFixed(2) : 0}</td>
                <td style={{ color: numericBudget !== optimizedTotalOfficers ? 'var(--amber)' : 'inherit' }}>{numericBudget ? (selectedRelief / numericBudget).toFixed(2) : 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: 'linear-gradient(to right, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.02))', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '20px 24px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <CheckCircle size={32} style={{ color: 'var(--green)', flexShrink: 0 }} />
        <div style={{ flex: '1 1 300px', fontSize: '16px', color: 'var(--text)', lineHeight: '1.6' }}>
          <strong>AI recommends deploying {optimizedTotalOfficers} officers across {optimizedPlaces} deployed places</strong> for
          <span style={{ color: 'var(--green)', fontWeight: 600 }}> {optimizedTotalRelief.toFixed(1)} CII relief </span>
          over the next 3 hours, outperforming the reactive baseline by <span style={{ color: 'var(--amber)', fontWeight: 600 }}>{Number(highlights.lift_pct || 0).toFixed(1)}%</span>.
        </div>
      </div>
    </div>
  );
}
