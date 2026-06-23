import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMissions } from '../../lib/api/hooks';
import { MissionCard } from '../data/MissionCard';
import { useSelectionStore } from '../../stores/useSelectionStore';
import type { MissionCard as MissionCardType } from '../../types/api';

const COLUMNS = ['chronic', 'spreading', 'active', 'resolving', 'dormant'] as const;

function getLifecycle(row: MissionCardType) {
  const lifecycle = String(row.lifecycle || 'active').toLowerCase();
  return COLUMNS.includes(lifecycle as (typeof COLUMNS)[number]) ? lifecycle : 'active';
}

export function MissionControlBoard() {
  const { data, isLoading, isError } = useMissions();
  const { select } = useSelectionStore();
  const navigate = useNavigate();

  const groupedMissions = React.useMemo(() => {
    const groups = Object.fromEntries(COLUMNS.map((column) => [column, [] as MissionCardType[]]));
    for (const row of data?.rows || []) {
      groups[getLifecycle(row)].push(row);
    }
    return groups;
  }, [data]);

  const openDetail = (h3: string) => select(h3);
  const pinToCanvas = (h3: string) => {
    select(h3);
    navigate(`/canvas?h3=${encodeURIComponent(h3)}`);
  };
  const copyH3 = (h3: string) => navigator.clipboard?.writeText(h3);

  if (isError) {
    return (
      <div role="alert" className="rounded-2xl border border-sig-critical/40 bg-sig-critical/10 p-5 text-sm text-sig-critical">
        Unable to load missions.
      </div>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-fg-primary">Mission control board</h1>
          <p className="mt-1 max-w-2xl text-sm text-fg-secondary">
            Lifecycle swimlanes for dispatch priority, canvas pinning, and field action.
          </p>
        </div>
        <div className="rounded-full border border-border-default bg-bg-glass/80 px-4 py-2 font-mono text-xs text-fg-secondary">
          {data?.rows?.length ?? 0} missions
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto pb-2">
        <div className="flex h-full min-w-max gap-4">
          {COLUMNS.map((lifecycle) => {
            const missions = groupedMissions[lifecycle];
            return (
              <section
                key={lifecycle}
                className="flex w-[330px] shrink-0 scroll-mx-4 snap-start flex-col overflow-hidden rounded-2xl border border-border-default bg-bg-canvas/52 shadow-glass backdrop-blur-md"
              >
                <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
                  <div>
                    <h2 className="text-sm font-semibold capitalize text-fg-primary">{lifecycle}</h2>
                    <p className="text-xs text-fg-tertiary">lifecycle lane</p>
                  </div>
                  <span className="rounded-full border border-border-default bg-white/[0.04] px-2.5 py-1 font-mono text-xs text-fg-secondary">
                    {missions.length}
                  </span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-3">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="h-[260px] animate-pulse rounded-xl border border-border-default bg-bg-elevated/50" />
                    ))
                  ) : missions.length ? (
                    missions.map((row) => (
                      <MissionCard
                        key={row.h3}
                        mission={row}
                        lifecycle={lifecycle}
                        onOpenDetail={openDetail}
                        onPinToCanvas={pinToCanvas}
                        onCopyH3={copyH3}
                      />
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-border-default bg-bg-elevated/30 px-4 py-8 text-center text-sm text-fg-secondary">
                      No {lifecycle} missions.
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}
