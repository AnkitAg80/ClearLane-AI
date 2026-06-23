import React from 'react';
import { Users } from 'lucide-react';
import { useOverview } from '../../lib/api/hooks';
import { useOptimizerStore } from '../../stores/useOptimizerStore';

export function OfficerBudgetControl() {
  const openOptimizer = useOptimizerStore((state) => state.openOptimizer);
  const budget = useOptimizerStore((state) => state.budget);
  const { data } = useOverview();
  const current = data?.summary?.officers_deployed ?? budget;

  return (
    <button
      type="button"
      onClick={openOptimizer}
      aria-label="Change officer budget"
      className="hidden h-9 items-center gap-2 rounded-full border border-accent/35 bg-accent/12 px-3 text-xs text-fg-primary transition-all hover:border-accent/70 hover:bg-accent/18 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent xl:flex"
    >
      <Users className="h-3.5 w-3.5 text-sig-cold" />
      <span>Officer budget</span>
      <span className="rounded-full border border-border-subtle bg-bg-canvas/70 px-2 py-0.5 font-mono text-[11px] text-sig-cold">
        {current}
      </span>
    </button>
  );
}
