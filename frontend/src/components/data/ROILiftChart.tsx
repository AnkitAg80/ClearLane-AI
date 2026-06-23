import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';

interface ROILiftChartProps {
  optimized: number;
  reactive: number;
}

export function ROILiftChart({ optimized, reactive }: ROILiftChartProps) {
  const max = Math.max(optimized, reactive, 1);
  const optimizedPct = Math.max(2, (optimized / max) * 100);
  const reactivePct = Math.max(2, (reactive / max) * 100);

  return (
    <Card className="p-4">
      <h3 className="mb-4 text-sm font-semibold">ROI Lift</h3>
      <div className="space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-xs text-fg-secondary">
            <span>Optimized Relief</span>
            <span className="font-tabular">{optimized.toFixed(1)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-sm bg-bg-canvas">
            <motion.div
              className="h-full rounded-sm bg-sig-calm"
              initial={{ width: 0 }}
              animate={{ width: `${optimizedPct}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs text-fg-secondary">
            <span>Reactive Relief</span>
            <span className="font-tabular">{reactive.toFixed(1)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-sm bg-bg-canvas">
            <motion.div
              className="h-full rounded-sm bg-sig-warn"
              initial={{ width: 0 }}
              animate={{ width: `${reactivePct}%` }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
