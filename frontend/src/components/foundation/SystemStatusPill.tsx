import React from 'react';
import { useHealth, useArtifacts } from '../../lib/api/hooks';
import { cn } from '../../lib/utils/cn';

export function SystemStatusPill({ className }: { className?: string }) {
  const { data: health } = useHealth();
  const { data: artifacts } = useArtifacts();

  const isReady = health?.status === 'ready';
  const missingArtifacts = artifacts?.artifacts?.filter((a) => !a.exists).length ?? 0;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider transition-colors',
        isReady && missingArtifacts === 0
          ? 'border-sig-calm/30 bg-sig-calm/10 text-sig-calm'
          : 'border-sig-warn/30 bg-sig-warn/10 text-sig-warn',
        className,
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          isReady && missingArtifacts === 0 ? 'bg-sig-calm' : 'bg-sig-warn',
        )}
      />
      {isReady && missingArtifacts === 0
        ? 'All Systems Nominal'
        : `${missingArtifacts} Artifact${missingArtifacts !== 1 ? 's' : ''} Missing`}
    </div>
  );
}
