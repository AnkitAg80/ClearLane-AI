import React from 'react';
import { motion } from 'framer-motion';
import { useOverview } from '../../lib/api/hooks';
import { AnimatedCounter } from '../foundation/AnimatedCounter';

export function OutcomeMetricBreaks() {
  const { data, isLoading } = useOverview();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-bg-elevated/50" />
        ))}
      </div>
    );
  }

  const { highlights } = data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-xl border border-border-default bg-gradient-to-br from-sig-calm/5 to-transparent p-5"
      >
        <div className="text-[11px] uppercase tracking-wider text-fg-tertiary mb-1">Optimized Relief</div>
        <div className="text-3xl font-tabular font-bold text-sig-calm">
          {highlights.optimized_relief != null ? <AnimatedCounter value={Number(highlights.optimized_relief)} decimals={1} /> : '-'}
        </div>
        <div className="text-xs text-fg-tertiary mt-1">Expected CII relief with optimized deployment</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-xl border border-border-default bg-gradient-to-br from-sig-warn/5 to-transparent p-5"
      >
        <div className="text-[11px] uppercase tracking-wider text-fg-tertiary mb-1">Reactive Relief</div>
        <div className="text-3xl font-tabular font-bold text-sig-warn">
          {highlights.reactive_relief != null ? <AnimatedCounter value={Number(highlights.reactive_relief)} decimals={1} /> : '-'}
        </div>
        <div className="text-xs text-fg-tertiary mt-1">Baseline CII relief without optimization</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-xl border border-border-default bg-gradient-to-br from-accent/5 to-transparent p-5"
      >
        <div className="text-[11px] uppercase tracking-wider text-fg-tertiary mb-1">Top 25 Recall</div>
        <div className="text-3xl font-tabular font-bold text-accent">
          {highlights.deployment_score_top25_recall != null ? `${(Number(highlights.deployment_score_top25_recall) * 100).toFixed(1)}%` : '-'}
        </div>
        <div className="text-xs text-fg-tertiary mt-1">Deployment score recall at top 25</div>
      </motion.div>
    </div>
  );
}
