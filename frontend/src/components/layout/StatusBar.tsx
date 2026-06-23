import React from 'react';
import { useArtifacts, useHealth, useOverview } from '../../lib/api/hooks';
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

export function StatusBar() {
  const { data: health } = useHealth();
  const { data: artifacts } = useArtifacts();
  const { data: overview } = useOverview();

  const healthyArtifacts = artifacts?.artifacts?.filter((artifact) => artifact.exists).length ?? 0;
  const totalArtifacts = artifacts?.artifacts?.length ?? 0;
  const missing_count = health?.missing_count ?? Math.max(totalArtifacts - healthyArtifacts, 0);
  const bbox = overview?.bbox;

  return (
    <footer className="h-7 w-full bg-bg-canvas hairline-t flex items-center px-4 text-xs font-mono text-fg-tertiary justify-between shrink-0 z-10">
      <div className="flex items-center gap-4">
        <SystemStatusPill />
        <div>Artifacts: {healthyArtifacts}/{totalArtifacts}</div>
        <div>Missing: {missing_count}</div>
        <div>Last sync: live query</div>
      </div>
      <div className="flex items-center gap-4">
        <div>
          BBOX: {formatBbox(bbox)}
        </div>
        <div>v1.0</div>
      </div>
    </footer>
  );
}
