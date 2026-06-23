import React from 'react';
import { motion } from 'framer-motion';
import { useOverview } from '../../lib/api/hooks';
import { AnimatedCounter } from '../foundation/AnimatedCounter';
import { SystemStatusPill } from '../foundation/SystemStatusPill';

export function CinematicOpsHero() {
  const { data, isLoading } = useOverview();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border-default bg-gradient-to-b from-bg-elevated/80 to-bg-void/60 p-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(94,106,210,0.06),transparent_60%)] pointer-events-none" />
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center shadow-glass"
              >
                <span className="text-white font-bold text-lg">CL</span>
              </motion.div>
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl"
                >
                  ClearLane AI
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="text-sm text-fg-secondary"
                >
                  Real-time situational awareness and deployment operations
                </motion.p>
              </div>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <SystemStatusPill />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {isLoading || !data ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-bg-elevated/60" />
            ))
          ) : (
            <>
              <div className="rounded-xl border border-border-default bg-bg-canvas/60 p-4">
                <div className="text-[11px] uppercase tracking-wider text-fg-tertiary mb-1">Officers Deployed</div>
                <div className="text-3xl font-tabular font-bold text-fg-primary">
                  <AnimatedCounter value={data.summary.officers_deployed} />
                </div>
              </div>
              <div className="rounded-xl border border-border-default bg-bg-canvas/60 p-4">
                <div className="text-[11px] uppercase tracking-wider text-fg-tertiary mb-1">Active Cells</div>
                <div className="text-3xl font-tabular font-bold text-fg-primary">
                  <AnimatedCounter value={data.summary.active_cells} />
                </div>
              </div>
              <div className="rounded-xl border border-border-default bg-bg-canvas/60 p-4">
                <div className="text-[11px] uppercase tracking-wider text-fg-tertiary mb-1">Expected Relief</div>
                <div className="text-3xl font-tabular font-bold text-sig-calm">
                  <AnimatedCounter value={data.summary.expected_relief} decimals={1} />
                </div>
              </div>
              <div className="rounded-xl border border-border-default bg-bg-canvas/60 p-4">
                <div className="text-[11px] uppercase tracking-wider text-fg-tertiary mb-1">Lift vs Reactive</div>
                <div className="text-3xl font-tabular font-bold text-accent">
                  +<AnimatedCounter value={data.summary.lift_pct} decimals={1} suffix="%" />
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
