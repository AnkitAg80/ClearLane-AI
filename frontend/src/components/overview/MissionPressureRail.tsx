import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Copy, MapPin } from 'lucide-react';
import { useMissions } from '../../lib/api/hooks';
import { useSelectionStore } from '../../stores/useSelectionStore';
import type { MissionCard as MissionCardType } from '../../types/api';

function getString(row: MissionCardType, key: string, fallback = '-') {
  const value = row[key];
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function getNumber(row: MissionCardType, key: string, fallback = 0) {
  const value = row[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function MissionPressureRail() {
  const { data, isLoading, isError } = useMissions();
  const navigate = useNavigate();
  const select = useSelectionStore((state) => state.select);
  const missions = data?.rows?.slice(0, 5) ?? [];

  if (isError) {
    return (
      <section role="alert" className="rounded-2xl border border-sig-critical/40 bg-sig-critical/10 p-5 text-sm text-sig-critical">
        Unable to load mission pressure rail.
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border-default bg-bg-canvas/55 p-5 shadow-glass backdrop-blur-md">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-fg-primary">Mission pressure rail</h2>
          <p className="mt-1 text-sm text-fg-secondary">Top dispatch candidates with direct canvas handoff.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/missions')}
          className="hidden rounded-full border border-border-default bg-white/[0.04] px-3 py-1.5 text-xs text-fg-secondary transition-colors hover:text-fg-primary md:inline-flex"
        >
          open board
        </button>
      </div>

      <div className="grid gap-3 xl:grid-cols-5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-44 animate-pulse rounded-xl border border-border-default bg-bg-elevated/50" />
          ))
        ) : missions.length ? (
          missions.map((mission, index) => {
            const expected_relief = getNumber(mission, 'expected_relief');
            const lifecycle = getString(mission, 'lifecycle', 'active');
            const rank = getNumber(mission, 'rank', index + 1);

            return (
              <article key={mission.h3} className="flex min-h-44 flex-col justify-between rounded-xl border border-border-default bg-bg-elevated/55 p-4">
                <div>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-accent">#{rank}</span>
                    <span className="rounded-full border border-border-default px-2 py-0.5 text-[11px] text-fg-secondary">{lifecycle}</span>
                  </div>
                  <h3 className="line-clamp-2 text-sm font-semibold text-fg-primary">{mission.label}</h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-fg-tertiary">{getString(mission, 'objective', getString(mission, 'top_location', 'Field action required'))}</p>
                </div>

                <div>
                  <div className="mb-3 flex items-end justify-between border-t border-border-subtle pt-3">
                    <span className="text-xs text-fg-tertiary">expected relief</span>
                    <span className="font-mono text-xl text-sig-calm">{expected_relief.toFixed(1)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button type="button" aria-label="Open detail" onClick={() => select(mission.h3)} className="flex h-8 items-center justify-center rounded-md border border-border-default bg-bg-canvas/60 text-fg-secondary hover:text-fg-primary">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" aria-label="Pin to canvas" onClick={() => { select(mission.h3); navigate(`/canvas?h3=${encodeURIComponent(mission.h3)}`); }} className="flex h-8 items-center justify-center rounded-md border border-border-default bg-bg-canvas/60 text-fg-secondary hover:text-fg-primary">
                      <MapPin className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" aria-label="Copy h3" onClick={() => navigator.clipboard?.writeText(mission.h3)} className="flex h-8 items-center justify-center rounded-md border border-border-default bg-bg-canvas/60 text-fg-secondary hover:text-fg-primary">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-xl border border-border-default bg-bg-elevated/50 p-8 text-center text-sm text-fg-secondary xl:col-span-5">
            No missions available.
          </div>
        )}
      </div>
    </section>
  );
}
