import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { NebulaBackgroundSystem } from '../foundation/NebulaBackgroundSystem';
import { RouteTransition } from '../foundation/RouteTransition';
import { CommandRail } from './CommandRail';
import { CommandCapsule } from './CommandCapsule';
import { SignalStatusDeck } from './SignalStatusDeck';
import { RightUtilityDock } from './RightUtilityDock';

function RouteStage() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <RouteTransition key={location.pathname}>
        <Outlet />
      </RouteTransition>
    </AnimatePresence>
  );
}

export function CommandDeckShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-bg-void text-fg-primary">
      <NebulaBackgroundSystem />
      <CommandRail />
      <RightUtilityDock />

      <div className="relative z-10 flex h-full min-w-0 flex-col pl-[76px] pr-3 pt-3 lg:pl-[276px] lg:pr-[68px]">
        <CommandCapsule />
        <main className="relative mt-3 min-h-0 flex-1 overflow-hidden rounded-xl border border-border-default bg-bg-canvas/45 shadow-glass backdrop-blur-sm">
          <RouteStage />
        </main>
        <SignalStatusDeck />
      </div>

      {children}
    </div>
  );
}
