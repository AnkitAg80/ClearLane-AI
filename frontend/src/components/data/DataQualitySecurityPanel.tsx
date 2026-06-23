import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldCheck, Database, Activity } from 'lucide-react';
import { useArtifacts, useEvidence, useOverview } from '../../lib/api/hooks';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils/cn';

export function DataQualitySecurityPanel() {
  const { data: evidence } = useEvidence();
  const { data: artifacts } = useArtifacts();
  const { data: overview } = useOverview();

  const metrics = [
    {
      icon: Database,
      label: 'Artifact Health',
      value: artifacts?.artifacts
        ? `${artifacts.artifacts.filter((a) => a.exists).length}/${artifacts.artifacts.length}`
        : '-',
      status: artifacts?.artifacts?.every((a) => a.exists) ? 'healthy' : artifacts?.artifacts?.some((a) => a.exists) ? 'degraded' : 'unknown',
    },
    {
      icon: Activity,
      label: 'Model Status',
      value: evidence?.model?.features?.length ? `${evidence.model.features.length} features` : 'N/A',
      status: evidence?.model?.features?.length ? 'healthy' : 'unknown',
    },
    {
      icon: ShieldCheck,
      label: 'Backtest Ready',
      value: evidence?.backtest ? 'Available' : 'N/A',
      status: evidence?.backtest ? 'healthy' : 'unknown',
    },
    {
      icon: Shield,
      label: 'Data Quality',
      value: overview?.summary?.active_cells ? `${overview.summary.active_cells} cells` : 'N/A',
      status: overview?.summary?.active_cells ? 'healthy' : 'unknown',
    },
  ];

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <Shield className="w-4 h-4 text-sig-calm" />
        Data Quality & Security
      </h3>
      <motion.div
        className="grid grid-cols-2 gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="rounded-lg border border-border-default bg-bg-canvas/60 p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3.5 h-3.5 text-fg-tertiary" />
                <span className="text-[11px] uppercase tracking-wider text-fg-tertiary">{metric.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-fg-primary">{metric.value}</span>
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    metric.status === 'healthy' ? 'bg-sig-calm' :
                    metric.status === 'degraded' ? 'bg-sig-warn' :
                    'bg-fg-quaternary',
                  )}
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </Card>
  );
}
