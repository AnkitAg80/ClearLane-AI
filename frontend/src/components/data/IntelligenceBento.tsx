import React from 'react';
import { motion } from 'framer-motion';
import { useIntelligence } from '../../lib/api/hooks';
import { Badge } from '../ui/Badge';
import { SpotlightCard } from '../foundation/SpotlightCard';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export function IntelligenceBento() {
  const { data, isLoading, isError } = useIntelligence();

  if (isError) {
    return (
      <div role="alert" className="rounded-lg border border-sig-critical/40 bg-sig-critical/10 p-4 text-sm text-sig-critical">
        Unable to load intelligence signals.
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      {isLoading ? (
        Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-48 rounded-xl border border-border-default bg-bg-elevated/50 animate-pulse" />
        ))
      ) : data?.rows && data.rows.length > 0 ? (
        data.rows.map((row) => (
          <motion.div key={row.h3} variants={item}>
            <SpotlightCard className="h-full rounded-xl border border-border-default bg-bg-elevated/80 hover:border-border-strong transition-colors">
              <div className="p-4 flex flex-col gap-4 h-full">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-fg-primary">{row.label}</h3>
                    <div className="text-xs text-fg-secondary mt-0.5">{row.top_police_station || 'Unknown Station'}</div>
                  </div>
                  <Badge
                    variant={
                      row.lifecycle === 'chronic' ? 'danger' :
                      row.lifecycle === 'active' ? 'warning' :
                      row.lifecycle === 'resolving' ? 'success' : 'default'
                    }
                    className="capitalize"
                  >
                    {row.lifecycle || 'active'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <div className="text-[10px] text-fg-tertiary uppercase tracking-wider mb-1">Capacity Theft</div>
                    <div className="font-tabular font-semibold text-lg">{Number(row.capacity_theft || 0).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-fg-tertiary uppercase tracking-wider mb-1">Criticality</div>
                    <div className="font-tabular font-semibold text-lg text-sig-warn">
                      {row.criticality?.minutes_to_critical
                        ? `${row.criticality.minutes_to_critical}m`
                        : 'Stable'}
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-border-default/50">
                  <div className="text-xs font-mono text-fg-tertiary truncate">
                    FP: {row.fingerprint || 'unknown'}
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>
        ))
      ) : (
        <div className="col-span-full py-12 text-center text-fg-secondary">
          No intelligence signals detected.
        </div>
      )}
    </motion.div>
  );
}
