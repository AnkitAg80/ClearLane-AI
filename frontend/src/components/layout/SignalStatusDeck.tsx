import React from 'react';
import { useArtifacts, useHealth, useOverview } from '../../lib/api/hooks';
import { useSelectionStore } from '../../stores/useSelectionStore';
import type { Bbox } from '../../types/api';
import { SystemStatusPill } from '../foundation/SystemStatusPill';

function formatBbox(bbox: Bbox | null | undefined) {
  if (!bbox) return 'pending';

  const values = Array.isArray(bbox)
    ? bbox
    : [bbox.west, bbox.south, bbox.east, bbox.north];

  return values
    .filter((value) => typeof value === 'number' && Number.isFinite(value))
    .map((value) => value.toFixed(2))
    .join(', ') || 'pending';
}

export function SignalStatusDeck() {
  const { data: health } = useHealth();
  const { data: artifacts } = useArtifacts();
  const { data: overview } = useOverview();
  const selectedH3 = useSelectionStore((state) => state.selectedH3);

  const healthyArtifacts = artifacts?.artifacts?.filter((artifact) => artifact.exists).length ?? 0;
  const totalArtifacts = artifacts?.artifacts?.length ?? 0;
  const missing_count = health?.missing_count ?? Math.max(totalArtifacts - healthyArtifacts, 0);

  return (
    <footer className="relative z-20 mt-2 flex h-9 shrink-0 items-center justify-between rounded-xl border border-border-default bg-bg-glass/85 px-3 font-mono text-[11px] text-fg-tertiary shadow-glass backdrop-blur-2xl">
      <div className="flex min-w-0 items-center gap-3">
        <SystemStatusPill className="hidden sm:inline-flex" />
        <span className="hidden md:inline">artifacts {healthyArtifacts}/{totalArtifacts}</span>
        <span className="hidden lg:inline">missing {missing_count}</span>
        <span className="truncate">selected {selectedH3 || 'none'}</span>
      </div>
      <div className="flex min-w-0 items-center gap-3">
        <span className="hidden sm:inline">bbox {formatBbox(overview?.bbox)}</span>
        <span>live query</span>
      </div>
    </footer>
  );
}
