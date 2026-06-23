import React from 'react';
import { Search, Bell, Command } from 'lucide-react';
import { FilterBar } from '../filters/FilterBar';
import { Button } from '../ui/Button';
import { useCommandStore } from '../../stores/useCommandStore';

export function TopBar() {
  const { setOpen } = useCommandStore();

  return (
    <header className="h-12 w-full bg-bg-canvas/80 backdrop-blur-md hairline-b flex items-center px-4 justify-between shrink-0 z-10 sticky top-0">
      <div className="flex-1 flex justify-center px-4">
        <FilterBar />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Open command palette"
          aria-keyshortcuts="Control+K Meta+K"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-3 h-8 rounded-md bg-bg-elevated border border-border-default text-xs text-fg-secondary hover:text-fg-primary transition-all group"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search or command...</span>
          <div className="flex items-center gap-0.5 ml-2 text-fg-quaternary group-hover:text-fg-tertiary">
            <Command className="w-3 h-3" />
            <span className="font-mono uppercase text-[10px]">K</span>
          </div>
        </button>

        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-sig-warn rounded-full ring-2 ring-bg-canvas" />
        </Button>
      </div>
    </header>
  );
}
