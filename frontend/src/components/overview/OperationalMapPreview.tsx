import React from 'react';
import { Map, Route, ShieldCheck, TrendingDown, UsersRound } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

interface OperationalMapPreviewProps {
  relief?: number;
  officers?: number;
  cells?: number;
}

const corridors = [
  'M 40 300 C 150 230, 190 122, 332 132 S 540 260, 640 110',
  'M 30 170 C 150 210, 260 200, 330 270 S 520 360, 650 270',
  'M 130 380 C 190 290, 270 270, 360 238 S 512 178, 680 196',
];

const nodes = [
  { x: '17%', y: '30%', tone: 'bg-sig-critical text-sig-critical', officers: 14 },
  { x: '29%', y: '58%', tone: 'bg-sig-warn text-sig-warn', officers: 7 },
  { x: '48%', y: '36%', tone: 'bg-sig-cold text-sig-cold', officers: 11 },
  { x: '62%', y: '66%', tone: 'bg-sig-calm text-sig-calm', officers: 5 },
  { x: '80%', y: '42%', tone: 'bg-sig-warn text-sig-warn', officers: 9 },
];

export function OperationalMapPreview({ relief = 0, officers = 0, cells = 0 }: OperationalMapPreviewProps) {
  const safeRelief = Number.isFinite(relief) ? relief : 0;
  const safeOfficers = Number.isFinite(officers) ? officers : 0;
  const safeCells = Number.isFinite(cells) ? cells : 0;

  return (
    <div className="relative min-h-[420px] overflow-hidden rounded-2xl border border-border-default bg-[#04070a]/82 shadow-glass">
      <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.10)_1px,transparent_1px)] [background-size:52px_52px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_26%_34%,rgba(248,113,113,0.16),transparent_18%),radial-gradient(circle_at_72%_45%,rgba(56,189,248,0.15),transparent_22%),linear-gradient(135deg,rgba(8,145,178,0.08),rgba(74,222,128,0.05)_46%,transparent_72%)]" />

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 720 460" fill="none" role="img" aria-label="Operational deployment preview">
        {corridors.map((path, index) => (
          <path
            key={path}
            d={path}
            stroke={index === 0 ? '#38bdf8' : index === 1 ? '#4ade80' : '#fbbf24'}
            strokeWidth={index === 0 ? 5 : 3}
            strokeLinecap="round"
            strokeDasharray={index === 0 ? '0' : '12 16'}
            opacity={index === 0 ? 0.68 : 0.42}
          />
        ))}
      </svg>

      <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-border-default bg-bg-glass/80 px-3 py-1.5 text-xs text-fg-secondary backdrop-blur-xl">
        <Map className="h-3.5 w-3.5 text-sig-cold" />
        tactical allocation preview
      </div>

      {nodes.map((node, index) => (
        <div
          key={`${node.x}-${node.y}`}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: node.x, top: node.y }}
        >
          <span className={cn('absolute inset-0 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-xl', node.tone)} />
          <span className={cn('relative flex h-10 w-10 items-center justify-center rounded-full border border-white/35 text-[10px] font-bold shadow-glass', node.tone)}>
            {index === 0 ? Math.max(1, Math.round(safeOfficers / 12)) : node.officers}
          </span>
        </div>
      ))}

      <div className="absolute bottom-5 left-5 right-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-border-default bg-bg-glass/80 p-3 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-[11px] text-fg-tertiary">
            <Route className="h-3.5 w-3.5 text-sig-cold" />
            Deployment corridors
          </div>
          <div className="mt-2 font-mono text-xl text-fg-primary">3</div>
        </div>
        <div className="rounded-xl border border-border-default bg-bg-glass/80 p-3 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-[11px] text-fg-tertiary">
            <UsersRound className="h-3.5 w-3.5 text-sig-warn" />
            Officer allocation
          </div>
          <div className="mt-2 font-mono text-xl text-sig-warn">{safeOfficers.toFixed(0)}</div>
        </div>
        <div className="rounded-xl border border-border-default bg-bg-glass/80 p-3 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-[11px] text-fg-tertiary">
            <TrendingDown className="h-3.5 w-3.5 text-sig-calm" />
            Predicted relief
          </div>
          <div className="mt-2 font-mono text-xl text-sig-calm">{safeRelief.toFixed(1)}</div>
        </div>
        <div className="rounded-xl border border-border-default bg-bg-glass/80 p-3 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-[11px] text-fg-tertiary">
            <ShieldCheck className="h-3.5 w-3.5 text-sig-cold" />
            Live hotspot cells
          </div>
          <div className="mt-2 font-mono text-xl text-sig-cold">{safeCells.toFixed(0)}</div>
        </div>
      </div>
    </div>
  );
}
