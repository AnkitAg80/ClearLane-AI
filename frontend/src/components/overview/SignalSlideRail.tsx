import React from 'react';
import { motion } from 'framer-motion';
import { useIntelligence } from '../../lib/api/hooks';
import { cn } from '../../lib/utils/cn';

const SIGNAL_LABELS: Record<string, { label: string; color: string }> = {
  critical: { label: 'Critical', color: 'bg-sig-critical' },
  warn: { label: 'Warning', color: 'bg-sig-warn' },
  watch: { label: 'Watch', color: 'bg-sig-watch' },
  calm: { label: 'Nominal', color: 'bg-sig-calm' },
};

export function SignalSlideRail() {
  const { data, isLoading } = useIntelligence();

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-bg-elevated/50 shrink-0" />
        ))}
      </div>
    );
  }

  if (!data?.rows?.length) return null;

  const topSignals = data.rows.slice(0, 12);
  const maxScore = Math.max(...topSignals.map((r) => r.deployment_score || 0), 1);

  return (
    <div className="overflow-hidden">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-tertiary mb-3">Active Signals</h3>
      <motion.div
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {topSignals.map((signal, i) => {
          const sigKey = (signal.deployment_score || 0) > 0.8 ? 'critical' : (signal.deployment_score || 0) > 0.5 ? 'warn' : 'calm';
          const sig = SIGNAL_LABELS[sigKey] || SIGNAL_LABELS.calm;

          return (
            <motion.div
              key={signal.h3}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
              className="flex items-center gap-2 shrink-0 rounded-full border border-border-default bg-bg-elevated/60 px-3 py-1.5 text-xs"
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', sig.color)} />
              <span className="font-medium text-fg-primary truncate max-w-[120px]">{signal.label}</span>
              <span className="font-tabular text-fg-tertiary">{((signal.deployment_score || 0) / maxScore * 100).toFixed(0)}</span>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
