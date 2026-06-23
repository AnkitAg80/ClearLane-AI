import React from 'react';
import { Crosshair, MapPin, RadioTower, ShieldAlert } from 'lucide-react';
import { useHotspots } from '../../lib/api/hooks';
import { useFilterStore } from '../../stores/useFilterStore';
import { useSelectionStore } from '../../stores/useSelectionStore';
import type { HotspotRow } from '../../types/api';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils/cn';

function getNumber(row: HotspotRow, key: string, fallback = 0) {
  const value = row[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function HotspotTriageStage() {
  const { data, isLoading, isError } = useHotspots();
  const query = useFilterStore((state) => state.query);
  const { selectedH3, select } = useSelectionStore();

  const rows = React.useMemo(() => {
    const source = data?.rows ?? [];
    if (!query.trim()) return source;
    const needle = query.toLowerCase();
    return source.filter((row) =>
      [row.label, row.top_police_station, row.top_location, row.h3]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [data, query]);

  const selected = rows.find((row) => row.h3 === selectedH3) ?? rows[0];

  if (isError) {
    return (
      <div role="alert" className="rounded-2xl border border-sig-critical/40 bg-sig-critical/10 p-5 text-sm text-sig-critical">
        Unable to load hotspot triage.
      </div>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-fg-primary">Hotspot triage stage</h1>
          <p className="mt-1 text-sm text-fg-secondary">
            Split command view with dense hotspot list and selected hotspot evidence.
          </p>
          <span className="sr-only">Split command view dense hotspot list selected hotspot evidence</span>
        </div>
        <div className="rounded-full border border-border-default bg-bg-glass/80 px-4 py-2 font-mono text-xs text-fg-secondary">
          {rows.length} visible
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-h-0 overflow-hidden rounded-2xl border border-border-default bg-bg-canvas/52 shadow-glass backdrop-blur-md">
          <div className="grid grid-cols-[72px_minmax(220px,1.2fr)_160px_120px_120px_120px] border-b border-border-default bg-bg-canvas/80 px-4 py-3 text-xs text-fg-secondary">
            <span>Rank</span>
            <span>Location</span>
            <span>Station</span>
            <span>Score</span>
            <span>Pred 3h</span>
            <span className="text-right">Officers</span>
          </div>
          <div className="h-full overflow-auto pb-14">
            {isLoading ? (
              Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="mx-4 my-3 h-14 animate-pulse rounded-xl bg-bg-elevated/50" />
              ))
            ) : rows.length ? (
              rows.map((row, index) => {
                const active = row.h3 === selected?.h3;
                const score = getNumber(row, 'deployment_score');
                return (
                  <button
                    key={row.h3}
                    type="button"
                    onClick={() => select(row.h3)}
                    className={cn(
                      'grid w-full grid-cols-[72px_minmax(220px,1.2fr)_160px_120px_120px_120px] items-center border-b border-border-subtle px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent',
                      active ? 'bg-accent/12 text-fg-primary shadow-[inset_3px_0_0_var(--accent)]' : 'hover:bg-bg-elevated/45',
                    )}
                  >
                    <span className="font-mono text-xs text-fg-tertiary">#{index + 1}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{row.label}</span>
                      <span className="block truncate font-mono text-[10px] text-fg-tertiary">{row.h3}</span>
                    </span>
                    <span className="truncate text-fg-secondary">{row.top_police_station || '-'}</span>
                    <span>
                      <Badge variant={score > 0.8 ? 'danger' : score > 0.5 ? 'warning' : 'default'}>
                        {score.toFixed(3)}
                      </Badge>
                    </span>
                    <span className="font-mono">{getNumber(row, 'pred_next_3h_cii').toFixed(1)}</span>
                    <span className="text-right font-mono">{row.officers_assigned ?? 0}</span>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-sm text-fg-secondary">No hotspots found matching your filters.</div>
            )}
          </div>
        </div>

        <aside className="min-h-0 rounded-2xl border border-border-default bg-bg-canvas/58 p-5 shadow-glass backdrop-blur-md">
          {selected ? (
            <div className="flex h-full flex-col gap-5">
              <div>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-border-default bg-bg-elevated text-sig-warn">
                  <Crosshair className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-semibold text-fg-primary">{selected.label}</h2>
                <p className="mt-1 text-sm text-fg-secondary">{selected.top_location || 'Location unavailable'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border-default bg-bg-elevated/45 p-3">
                  <RadioTower className="mb-3 h-4 w-4 text-sig-cold" />
                  <div className="text-xs text-fg-tertiary">Score</div>
                  <div className="mt-1 font-mono text-xl text-fg-primary">{getNumber(selected, 'deployment_score').toFixed(3)}</div>
                </div>
                <div className="rounded-xl border border-border-default bg-bg-elevated/45 p-3">
                  <ShieldAlert className="mb-3 h-4 w-4 text-sig-warn" />
                  <div className="text-xs text-fg-tertiary">Forecast</div>
                  <div className="mt-1 font-mono text-xl text-sig-warn">{getNumber(selected, 'pred_next_3h_cii').toFixed(1)}</div>
                </div>
              </div>

              <div className="rounded-xl border border-border-default bg-bg-elevated/45 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-fg-primary">
                  <MapPin className="h-4 w-4 text-sig-cold" />
                  Map context
                </div>
                <div className="space-y-2 text-sm text-fg-secondary">
                  <div>Station: {selected.top_police_station || '-'}</div>
                  <div>Officers: {selected.officers_assigned ?? 0}</div>
                  <div>Expected relief: {getNumber(selected, 'expected_relief').toFixed(1)}</div>
                  <div>Support: {getNumber(selected, 'support_score').toFixed(2)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-fg-secondary">Select a hotspot.</div>
          )}
        </aside>
      </div>
    </section>
  );
}
