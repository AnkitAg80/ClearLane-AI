import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Command, Search } from 'lucide-react';
import { FilterBar } from '../filters/FilterBar';
import { SimpleLocationSearchBox } from '../filters/SimpleLocationSearchBox';
import { SystemStatusPill } from '../foundation/SystemStatusPill';
import { OfficerBudgetControl } from '../deployment/OfficerBudgetControl';
import { useCommandStore } from '../../stores/useCommandStore';
import { Tooltip } from '../foundation/Tooltip';

const ROUTE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Overview', subtitle: 'Live curb pressure' },
  '/canvas': { title: 'Canvas', subtitle: 'Spatial command stage' },
  '/hotspots': { title: 'Hotspots', subtitle: 'Triage queue' },
  '/timeline': { title: 'Timeline', subtitle: 'Forecast horizon' },
  '/intelligence': { title: 'Intelligence', subtitle: 'Signal board' },
  '/deployment': { title: 'Deployment', subtitle: 'Optimization theatre' },
  '/missions': { title: 'Missions', subtitle: 'Lifecycle board' },
  '/evidence': { title: 'Evidence', subtitle: 'Trust narrative' },
  '/artifacts': { title: 'Artifacts', subtitle: 'Diagnostics wall' },
};

function getRouteTitle(pathname: string) {
  return ROUTE_TITLES[pathname] ?? ROUTE_TITLES['/'];
}

export function CommandCapsule() {
  const { pathname } = useLocation();
  const { setOpen } = useCommandStore();
  const route = getRouteTitle(pathname);

  return (
    <header className="relative z-20 flex flex-col gap-4 rounded-xl border border-border-default bg-bg-glass/90 px-4 py-3 shadow-glass backdrop-blur-2xl">
      {/* Row 1: Global Search & Status */}
      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex-1 max-w-[400px]">
          <SimpleLocationSearchBox />
        </div>
        
        <div className="flex shrink-0 items-center gap-2">
          <OfficerBudgetControl />
          <SystemStatusPill />
          <Tooltip content="Open Command Palette" side="bottom">
            <button
              type="button"
              aria-label="Open command palette"
              aria-keyshortcuts="Control+K Meta+K"
              onClick={() => setOpen(true)}
              className="hidden lg:flex h-9 items-center gap-2 rounded-full border border-border-default bg-white/[0.05] px-3 text-xs text-fg-secondary transition-all hover:border-accent/60 hover:text-fg-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent active:scale-[0.98]"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Search or command</span>
              <span className="flex items-center gap-0.5 rounded-full border border-border-subtle px-1.5 py-0.5 font-mono text-[10px] text-fg-tertiary">
                <Command className="h-3 w-3" />K
              </span>
            </button>
          </Tooltip>
          
          <Tooltip content="Alerts & Notifications" side="bottom">
            <button
              type="button"
              aria-label="Notifications"
              className="relative hidden lg:flex h-9 w-9 items-center justify-center rounded-full border border-border-default bg-white/[0.05] text-fg-secondary transition-colors hover:text-fg-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-sig-warn" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Row 2: Canvas Controls & Filters */}
      <div className="flex w-full items-center justify-between gap-4">
        <div className="min-w-[150px] shrink-0 xl:block">
          <div className="text-sm font-semibold tracking-tight text-fg-primary">{route.title}</div>
          <div className="text-xs text-fg-tertiary">{route.subtitle}</div>
        </div>
        
        <div className="flex flex-1 items-center justify-end overflow-x-auto overflow-y-hidden no-scrollbar">
          <FilterBar />
        </div>
      </div>
    </header>
  );
}
