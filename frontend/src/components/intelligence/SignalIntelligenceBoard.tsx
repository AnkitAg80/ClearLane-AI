import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Activity, Fingerprint, Gauge, TimerReset } from 'lucide-react';
import { useIntelligence } from '../../lib/api/hooks';
import { SpotlightCard } from '../foundation/SpotlightCard';
import { Badge } from '../ui/Badge';

function StickySummaryStrip({ total = 0, critical = 0, gap = 0 }: { total?: number; critical?: number; gap?: number }) {
  return (
    <div className="sticky top-0 z-10 grid gap-3 rounded-2xl border border-border-default bg-bg-glass/90 p-3 shadow-glass backdrop-blur-xl md:grid-cols-3">
      <div className="rounded-xl border border-border-subtle bg-bg-canvas/55 p-3">
        <div className="text-xs text-fg-tertiary">Signals</div>
        <div className="mt-1 font-mono text-2xl text-fg-primary">{total}</div>
      </div>
      <div className="rounded-xl border border-border-subtle bg-bg-canvas/55 p-3">
        <div className="text-xs text-fg-tertiary">Critical</div>
        <div className="mt-1 font-mono text-2xl text-sig-critical">{critical}</div>
      </div>
      <div className="rounded-xl border border-border-subtle bg-bg-canvas/55 p-3">
        <div className="text-xs text-fg-tertiary">Opportunity gap</div>
        <div className="mt-1 font-mono text-2xl text-sig-calm">{gap.toFixed(1)}</div>
      </div>
    </div>
  );
}

export function SignalIntelligenceBoard() {
  const { data, isLoading, isError } = useIntelligence();
  const rows = data?.rows ?? [];
  const summary = data?.summary;

  if (isError) {
    return (
      <div role="alert" className="rounded-2xl border border-sig-critical/40 bg-sig-critical/10 p-5 text-sm text-sig-critical">
        Unable to load intelligence signals.
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-fg-primary">Signal intelligence board</h1>
        <p className="mt-1 text-sm text-fg-secondary">Lifecycle, Capacity Theft, Criticality, FP: fingerprints, and opportunity_gap in one board.</p>
      </div>

      <StickySummaryStrip
        total={summary?.total_hotspots ?? rows.length}
        critical={summary?.critical_count ?? rows.filter((row) => row.criticality?.severity === 'critical').length}
        gap={summary?.total_opportunity_gap ?? rows.reduce((acc, row) => acc + Number(row.opportunity_gap || 0), 0)}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.2fr_0.8fr_1fr]">
        {isLoading ? (
          Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl border border-border-default bg-bg-elevated/50" />
          ))
        ) : rows.length ? (
          rows.map((row, index) => (
            <motion.div
              key={row.h3}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.25, delay: index * 0.015 }}
            >
              <SpotlightCard className="h-full rounded-2xl border border-border-default bg-bg-elevated/62 p-4 shadow-glass">
                <div className="flex h-full flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-fg-primary">{row.label}</h2>
                      <p className="mt-1 truncate text-xs text-fg-secondary">{row.top_police_station || 'Unknown Station'}</p>
                    </div>
                    <Badge variant={row.lifecycle === 'chronic' ? 'danger' : row.lifecycle === 'active' ? 'warning' : row.lifecycle === 'resolving' ? 'success' : 'default'} className="capitalize">
                      {row.lifecycle || 'active'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border-subtle bg-bg-canvas/45 p-3">
                      <Gauge className="mb-3 h-4 w-4 text-sig-cold" />
                      <div className="text-xs text-fg-tertiary">Capacity Theft</div>
                      <div className="mt-1 font-mono text-lg text-fg-primary">{Number(row.capacity_theft || 0).toFixed(1)}%</div>
                    </div>
                    <div className="rounded-xl border border-border-subtle bg-bg-canvas/45 p-3">
                      <TimerReset className="mb-3 h-4 w-4 text-sig-warn" />
                      <div className="text-xs text-fg-tertiary">Criticality</div>
                      <div className="mt-1 font-mono text-lg text-sig-warn">{row.criticality?.minutes_to_critical ? `${row.criticality.minutes_to_critical}m` : 'Stable'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_auto] gap-3 rounded-xl border border-border-subtle bg-bg-canvas/45 p-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2 text-xs text-fg-tertiary">
                        <Fingerprint className="h-3.5 w-3.5" />
                        FP:
                      </div>
                      <div className="truncate font-mono text-xs text-fg-secondary">{row.fingerprint || 'unknown'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-fg-tertiary">opportunity_gap</div>
                      <div className="font-mono text-lg text-sig-calm">{Number(row.opportunity_gap || 0).toFixed(1)}</div>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center gap-2 text-xs text-fg-tertiary">
                    {row.forecast_horizon_source === 'learned' ? <Activity className="h-3.5 w-3.5 text-sig-calm" /> : <AlertTriangle className="h-3.5 w-3.5 text-sig-warn" />}
                    {row.forecast_horizon_source}
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          ))
        ) : (
          <div className="rounded-2xl border border-border-default p-8 text-center text-sm text-fg-secondary md:col-span-2 xl:col-span-3">
            No intelligence signals detected.
          </div>
        )}
      </div>
    </section>
  );
}
