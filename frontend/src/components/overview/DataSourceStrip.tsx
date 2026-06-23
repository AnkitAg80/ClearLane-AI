import React from 'react';
import { motion } from 'framer-motion';
import { useEvidence, useArtifacts } from '../../lib/api/hooks';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export function DataSourceStrip() {
  const { data: evidence } = useEvidence();
  const { data: artifacts } = useArtifacts();

  const sources = [
    { label: 'Model', status: evidence?.model?.features?.length ? 'ready' : 'unknown' },
    { label: 'Backtest', status: evidence?.backtest ? 'ready' : 'unknown' },
    { label: 'Feature Importance', status: evidence?.feature_importance?.regression?.length ? 'ready' : 'unknown' },
    { label: 'Artifacts', status: artifacts?.artifacts?.some((a) => a.exists) ? 'ready' : artifacts?.artifacts?.some((a) => !a.exists) ? 'partial' : 'unknown' },
  ];

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-tertiary mb-3">Data Sources</h3>
      <motion.div
        className="flex flex-wrap gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {sources.map((source) => (
          <div
            key={source.label}
            className="inline-flex items-center gap-1.5 rounded-md border border-border-default bg-bg-elevated/60 px-2.5 py-1 text-xs"
          >
            {source.status === 'ready' ? (
              <CheckCircle2 className="w-3 h-3 text-sig-calm" />
            ) : source.status === 'partial' ? (
              <AlertTriangle className="w-3 h-3 text-sig-warn" />
            ) : (
              <XCircle className="w-3 h-3 text-fg-tertiary" />
            )}
            <span className="text-fg-secondary">{source.label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
