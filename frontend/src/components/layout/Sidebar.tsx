import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils/cn';
import { Map, LayoutDashboard, Crosshair, Clock, ShieldAlert, Zap, Target, LineChart, Database } from 'lucide-react';
import { Tooltip } from '../foundation/Tooltip';

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/canvas', label: 'Canvas', icon: Map },
  { path: '/hotspots', label: 'Hotspots', icon: Crosshair },
  { path: '/timeline', label: 'Timeline', icon: Clock },
  { path: '/intelligence', label: 'Intelligence', icon: ShieldAlert },
  { path: '/deployment', label: 'Deployment', icon: Zap },
  { path: '/missions', label: 'Missions', icon: Target },
  { path: '/evidence', label: 'Evidence', icon: LineChart },
  { path: '/artifacts', label: 'Artifacts', icon: Database },
];

export function Sidebar() {
  return (
    <nav className="w-16 md:w-64 flex flex-col bg-bg-canvas hairline-r h-full overflow-y-auto overflow-x-hidden pt-4 pb-4 px-2 transition-all duration-300 z-10 shrink-0">
      <div className="mb-8 px-2 flex flex-col md:flex-row md:items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0 shadow-glass">
          <Map className="w-5 h-5 text-white" />
        </div>
        <div className="hidden md:block font-bold tracking-tight text-fg-primary text-sm">
          ClearLane AI
        </div>
      </div>
      
      <div className="flex flex-col gap-1 w-full flex-1">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <Tooltip key={path} content={label} side="right" sideOffset={16} className="md:hidden">
            <NavLink
              to={path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 w-full h-9 rounded-md transition-all text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent active:scale-[0.98]',
                  isActive
                    ? 'bg-bg-elevated text-fg-primary shadow-sm hairline-b'
                    : 'text-fg-secondary hover:text-fg-primary hover:bg-bg-elevated/50'
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="hidden md:block truncate">{label}</span>
            </NavLink>
          </Tooltip>
        ))}
      </div>
    </nav>
  );
}
