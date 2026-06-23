import React from 'react';
import { Bot, Command, SlidersHorizontal, Zap } from 'lucide-react';
import { useAssistantStore } from '../../stores/useAssistantStore';
import { useCommandStore } from '../../stores/useCommandStore';
import { useOptimizerStore } from '../../stores/useOptimizerStore';

export function RightUtilityDock() {
  const setAssistantOpen = useAssistantStore((state) => state.setOpen);
  const openOptimizer = useOptimizerStore((state) => state.openOptimizer);
  const setCommandOpen = useCommandStore((state) => state.setOpen);

  return (
    <aside
      aria-label="Utility dock"
      className="fixed bottom-14 right-3 top-24 z-30 hidden w-12 flex-col items-center gap-2 rounded-xl border border-border-default bg-bg-glass/80 p-2 shadow-glass backdrop-blur-2xl lg:flex"
    >
      <button
        type="button"
        aria-label="Open assistant"
        onClick={() => setAssistantOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-white/[0.04] text-fg-secondary transition-colors hover:text-fg-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
      >
        <Bot className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Open optimizer"
        onClick={openOptimizer}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-white/[0.04] text-fg-secondary transition-colors hover:text-fg-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
      >
        <Zap className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Open command palette"
        onClick={() => setCommandOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-white/[0.04] text-fg-secondary transition-colors hover:text-fg-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
      >
        <Command className="h-4 w-4" />
      </button>
      <div className="mt-auto flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-white/[0.03] text-fg-quaternary">
        <SlidersHorizontal className="h-4 w-4" />
      </div>
    </aside>
  );
}
