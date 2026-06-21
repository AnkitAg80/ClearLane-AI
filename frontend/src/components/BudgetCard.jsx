import { useState } from 'react';
import { Crosshair } from 'lucide-react';

export default function BudgetCard({ deployedCount, onOptimize, isLoading }) {
  const [budget, setBudget] = useState(100);

  const handleApply = () => {
    onOptimize(budget);
  };

  return (
    <article className="metric-card metric-card--success" title="Total available police personnel strategically allocated across all active zones.">
      <div className="metric-card__top">
        <span>Assigned Officers</span>
        <Crosshair size={18} aria-hidden="true" />
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
        <input 
          type="range" 
          min="10" 
          max="500" 
          step="10" 
          value={budget} 
          onChange={(e) => setBudget(Number(e.target.value))} 
          style={{ flex: 1, accentColor: 'var(--green)', cursor: 'pointer' }}
          disabled={isLoading}
        />
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
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
        <small style={{ color: 'var(--muted)', fontSize: '11px' }}>
          Deployed: {deployedCount ?? 0}
        </small>
        <button 
          type="button" 
          className="primary-button" 
          style={{ minHeight: '26px', padding: '0 10px', fontSize: '11px' }}
          onClick={handleApply}
          disabled={isLoading}
        >
          {isLoading ? 'Optimizing...' : 'Optimize'}
        </button>
      </div>
    </article>
  );
}
