import React from 'react';
import { Settings2, TrendingUp, Users, Zap } from 'lucide-react';
import { useDeployment, useOptimizeMutation } from '../../lib/api/hooks';
import { useOptimizerStore } from '../../stores/useOptimizerStore';
import { MagneticButton } from '../foundation/MagneticButton';
import { PendingMutationOverlay } from '../foundation/PendingMutationOverlay';
import { ROILiftChart } from '../data/ROILiftChart';
import type { HotspotRow } from '../../types/api';

function formatNumber(value: number | null | undefined, precision = 1) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(precision) : '0.0';
}

function DeploymentList({ title, rows, muted = false }: { title: string; rows: (HotspotRow | Record<string, unknown>)[]; muted?: boolean }) {
  return (
    <section className="min-h-0 rounded-2xl border border-border-default bg-bg-canvas/58 shadow-glass backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
        <h2 className="text-sm font-semibold text-fg-primary">{title}</h2>
        <span className="rounded-full border border-border-default px-2 py-0.5 font-mono text-xs text-fg-secondary">{rows.length}</span>
      </div>
      <div className="max-h-[470px] space-y-2 overflow-y-auto p-3">
        {rows.slice(0, 15).map((row, index) => {
          const label = typeof row.label === 'string' ? row.label : 'Location';
          const key = typeof row.h3 === 'string' ? row.h3 : `${title}-${index}`;
          const officers = typeof row.officers_assigned === 'number' ? row.officers_assigned : 0;
          const relief = typeof row.expected_relief === 'number' ? row.expected_relief : 0;

          return (
            <div key={key} className="grid grid-cols-[32px_minmax(0,1fr)_72px_76px] items-center gap-3 rounded-xl border border-border-subtle bg-bg-elevated/35 px-3 py-2 text-sm">
              <span className="font-mono text-xs text-fg-tertiary">{index + 1}</span>
              <span className={muted ? 'truncate text-fg-secondary' : 'truncate font-medium text-fg-primary'}>{label}</span>
              <span className="text-right font-mono text-fg-secondary">{officers}</span>
              <span className={muted ? 'text-right font-mono text-fg-tertiary' : 'text-right font-mono text-sig-calm'}>{formatNumber(relief)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function DeploymentTheatre() {
  const { data, isLoading } = useDeployment();
  const optimize = useOptimizeMutation();
  const { openOptimizer } = useOptimizerStore();

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-64 animate-pulse rounded-2xl border border-border-default bg-bg-elevated/50" />
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="h-80 animate-pulse rounded-2xl border border-border-default bg-bg-elevated/50" />
          <div className="h-80 animate-pulse rounded-2xl border border-border-default bg-bg-elevated/50" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-sig-critical/40 bg-sig-critical/10 p-5 text-sm text-sig-critical">
        Failed to load deployment data.
      </div>
    );
  }

  const optimizedRelief = Number(data.totals.optimized_relief || 0);
  const reactiveRelief = Number(data.totals.reactive_relief || 0);
  const lift = Number(data.totals.lift_pct || 0);

  return (
    <section className="relative space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="relative overflow-hidden rounded-2xl border border-border-default bg-bg-canvas/58 p-6 shadow-glass backdrop-blur-md">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(74,222,128,0.13),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(255,179,71,0.11),transparent_28%)]" />
          <div className="relative z-10">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-fg-primary">Deployment theatre</h1>
                <p className="mt-1 max-w-2xl text-sm text-fg-secondary">
                  Optimized allocation centered against reactive baseline with relief and officer load visible.
                </p>
              </div>
              <MagneticButton variant="secondary" size="md" className="gap-2" onClick={openOptimizer}>
                <Settings2 className="h-4 w-4" />
                Re-optimize Plan
              </MagneticButton>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-border-default bg-bg-elevated/45 p-4">
                <Users className="mb-4 h-4 w-4 text-sig-cold" />
                <div className="text-xs text-fg-tertiary">Optimized Officers</div>
                <div className="mt-1 font-mono text-2xl text-fg-primary">{data.totals.optimized_officers}</div>
              </div>
              <div className="rounded-xl border border-border-default bg-bg-elevated/45 p-4">
                <Users className="mb-4 h-4 w-4 text-fg-tertiary" />
                <div className="text-xs text-fg-tertiary">Reactive Officers</div>
                <div className="mt-1 font-mono text-2xl text-fg-primary">{data.totals.reactive_officers}</div>
              </div>
              <div className="rounded-xl border border-border-default bg-bg-elevated/45 p-4">
                <Zap className="mb-4 h-4 w-4 text-sig-calm" />
                <div className="text-xs text-fg-tertiary">Optimized Relief</div>
                <div className="mt-1 font-mono text-2xl text-sig-calm">{formatNumber(optimizedRelief)}</div>
              </div>
              <div className="rounded-xl border border-border-default bg-bg-elevated/45 p-4">
                <TrendingUp className="mb-4 h-4 w-4 text-sig-warn" />
                <div className="text-xs text-fg-tertiary">Reactive Relief</div>
                <div className="mt-1 font-mono text-2xl text-sig-warn">{formatNumber(reactiveRelief)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <ROILiftChart optimized={optimizedRelief} reactive={reactiveRelief} />
          <div className="rounded-2xl border border-border-default bg-bg-canvas/58 p-5 shadow-glass backdrop-blur-md">
            <div className="text-xs text-fg-tertiary">Lift vs Reactive</div>
            <div className="mt-2 font-mono text-4xl text-sig-calm">+{formatNumber(lift, 1)}%</div>
            <div className="mt-2 text-sm text-fg-secondary">Animated deltas update after optimizer mutation invalidates data.</div>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 gap-5 xl:grid-cols-2">
        <DeploymentList title="Optimized Allocation" rows={data.optimized || []} />
        <DeploymentList title="Reactive Baseline" rows={data.reactive || []} muted />
      </div>

      <PendingMutationOverlay isPending={optimize.isPending} />
    </section>
  );
}
