import React from 'react';
import { Copy, ExternalLink, MapPin, Navigation, ShieldCheck, Target, Timer } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import type { MissionCard as MissionCardType } from '../../types/api';

function getString(row: MissionCardType, key: string, fallback = '-') {
  const value = row[key];
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function getNumber(row: MissionCardType, key: string, fallback = 0) {
  const value = row[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

interface MissionCardProps {
  mission: MissionCardType;
  lifecycle: string;
  onOpenDetail: (h3: string) => void;
  onPinToCanvas: (h3: string) => void;
  onCopyH3: (h3: string) => void;
}

export function MissionCard({ mission, lifecycle, onOpenDetail, onPinToCanvas, onCopyH3 }: MissionCardProps) {
  const row = mission;
  const objective = getString(row, 'objective', `Stabilize ${row.label}`);
  const expected_relief = getNumber(row, 'expected_relief');
  const officers = getNumber(row, 'officers_assigned', 2);
  const minutes = getNumber(row, 'minutes_to_critical', getNumber(row, 'time_to_critical'));
  const evidence_count = getNumber(row, 'evidence_count', getNumber(row, 'signal_count', 0));

  return (
    <article className="flex h-[260px] flex-col justify-between rounded-xl border border-border-default bg-bg-elevated/55 p-4 shadow-glass transition-colors hover:border-accent/50">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-accent">#{getNumber(row, 'rank', 0) || '-'}</span>
              <h2 className="truncate text-sm font-semibold">{row.label}</h2>
            </div>
            <div className="mt-1 line-clamp-2 text-xs leading-5 text-fg-secondary">{objective}</div>
          </div>
          <Badge variant={lifecycle === 'chronic' || lifecycle === 'spreading' ? 'danger' : 'outline'} className="capitalize">
            {lifecycle}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-fg-secondary">
          <div className="rounded-lg border border-border-subtle bg-bg-canvas/45 p-2">
            <div className="mb-1 flex items-center gap-1.5 text-fg-tertiary">
              <Target className="h-3 w-3" />
              Officers
            </div>
            <div className="font-mono text-fg-primary">{officers}</div>
          </div>
          <div className="rounded-lg border border-border-subtle bg-bg-canvas/45 p-2">
            <div className="mb-1 flex items-center gap-1.5 text-fg-tertiary">
              <Navigation className="h-3 w-3" />
              Relief
            </div>
            <div className="font-mono text-sig-calm">{expected_relief.toFixed(1)}</div>
          </div>
          <div className="rounded-lg border border-border-subtle bg-bg-canvas/45 p-2">
            <div className="mb-1 flex items-center gap-1.5 text-fg-tertiary">
              <Timer className="h-3 w-3" />
              SLA
            </div>
            <div className="font-mono text-sig-warn">{minutes > 0 ? `${minutes}m` : 'stable'}</div>
          </div>
          <div className="rounded-lg border border-border-subtle bg-bg-canvas/45 p-2">
            <div className="mb-1 flex items-center gap-1.5 text-fg-tertiary">
              <ShieldCheck className="h-3 w-3" />
              Evidence
            </div>
            <div className="font-mono text-fg-primary">{evidence_count}</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-fg-tertiary">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{getString(row, 'top_location', 'Unknown Location')}</span>
        </div>
      </div>

      <div>
        <div className="mb-3 truncate border-t border-border-default/50 pt-3 font-mono text-[10px] text-fg-tertiary">{row.h3}</div>
        <div className="grid grid-cols-3 gap-2">
          <Button type="button" variant="secondary" size="sm" aria-label="Open detail" className="px-2" onClick={() => onOpenDetail(row.h3)}>
            <ExternalLink className="h-3 w-3" />
            <span className="sr-only">Open detail</span>
            <span aria-hidden="true" className="text-[11px]">Open</span>
          </Button>
          <Button type="button" variant="secondary" size="sm" aria-label="Pin to canvas" className="px-2" onClick={() => onPinToCanvas(row.h3)}>
            <MapPin className="h-3 w-3" />
            <span className="sr-only">Pin to canvas</span>
            <span aria-hidden="true" className="text-[11px]">Pin</span>
          </Button>
          <Button type="button" variant="secondary" size="sm" aria-label="Copy h3" className="px-2" onClick={() => onCopyH3(row.h3)}>
            <Copy className="h-3 w-3" />
            <span className="sr-only">Copy h3</span>
            <span aria-hidden="true" className="text-[11px]">Copy</span>
          </Button>
        </div>
      </div>
    </article>
  );
}
