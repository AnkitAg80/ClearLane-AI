import React from 'react';
import { NavLink } from 'react-router-dom';
import { Clock, Crosshair, Database, LayoutDashboard, LineChart, Map, ShieldAlert, Target, Zap } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/canvas', label: 'Canvas', icon: Map },
  { path: '/hotspots', label: 'Hotspots', icon: Crosshair },
  { path: '/timeline', label: 'Timeline', icon: Clock },
  { path: '/intelligence', label: 'Intel', icon: ShieldAlert },
  { path: '/deployment', label: 'Deploy', icon: Zap },
  { path: '/missions', label: 'Missions', icon: Target },
  { path: '/evidence', label: 'Evidence', icon: LineChart },
  { path: '/artifacts', label: 'Artifacts', icon: Database },
];

export function CommandRail() {
  return (
    <nav
      aria-label="Primary command rail"
      className="fixed bottom-12 left-3 top-3 z-30 flex w-14 flex-col rounded-xl border border-border-default bg-bg-glass/80 p-2 shadow-glass backdrop-blur-2xl lg:w-60"
    >
      <div className="mb-4 flex h-12 items-center justify-center gap-3 rounded-lg border border-border-subtle bg-white/[0.04] lg:justify-start lg:px-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent text-white shadow-glass">
          <Map className="h-4 w-4" />
        </div>
        <div className="hidden min-w-0 lg:block">
          <div className="truncate text-sm font-semibold tracking-tight text-fg-primary">ClearLane AI</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-tertiary">Command Deck</div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto scrollbar-none">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              cn(
                'group relative flex h-10 items-center justify-center gap-3 rounded-lg px-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent active:scale-[0.98] lg:justify-start',
                isActive
                  ? 'bg-white/[0.08] text-fg-primary shadow-[inset_3px_0_0_var(--accent)]'
                  : 'text-fg-secondary hover:bg-white/[0.05] hover:text-fg-primary',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden truncate lg:block">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
