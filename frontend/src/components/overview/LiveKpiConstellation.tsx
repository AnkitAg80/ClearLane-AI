import React from 'react';
import { Activity, Crosshair, TrendingUp, Users } from 'lucide-react';
import { AnimatedCounter } from '../foundation/AnimatedCounter';
import type { OverviewSummary } from '../../types/api';
import { cn } from '../../lib/utils/cn';

interface KpiDef {
  key: keyof Pick<OverviewSummary, 'officers_deployed' | 'active_cells' | 'expected_relief' | 'lift_pct'>;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  decimals?: number;
  suffix?: string;
  tone: string;
}

const KPI_DEFS: KpiDef[] = [
  { key: 'officers_deployed', label: 'Officers deployed', icon: Users, tone: 'text-sig-cold' },
  { key: 'active_cells', label: 'Active cells', icon: Crosshair, tone: 'text-sig-warn' },
  { key: 'expected_relief', label: 'Expected relief', icon: Activity, decimals: 1, tone: 'text-sig-calm' },
  { key: 'lift_pct', label: 'Lift vs reactive', icon: TrendingUp, decimals: 1, suffix: '%', tone: 'text-accent' },
];

function formatFallback(value: number | null | undefined, decimals = 0, suffix = '') {
  return typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(decimals)}${suffix}` : '-';
}

export function LiveKpiConstellation({ summary }: { summary?: OverviewSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {KPI_DEFS.map((item, index) => {
        const Icon = item.icon;
        const value = summary?.[item.key];
        const isValid = typeof value === 'number' && Number.isFinite(value);

        return (
          <div
            key={item.key}
            className={cn(
              'relative overflow-hidden rounded-xl border border-border-default bg-bg-canvas/62 p-4 shadow-glass backdrop-blur-xl',
              index === 0 && 'xl:-translate-y-2',
              index === 2 && 'xl:translate-y-3',
            )}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-xs text-fg-secondary">{item.label}</span>
              <Icon className={cn('h-4 w-4', item.tone)} />
            </div>
            <div className={cn('font-mono text-3xl font-semibold tracking-tight', item.tone)}>
              {isValid ? (
                <AnimatedCounter value={value} decimals={item.decimals ?? 0} suffix={item.suffix ?? ''} />
              ) : (
                formatFallback(value, item.decimals, item.suffix)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
