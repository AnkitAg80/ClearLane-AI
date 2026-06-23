import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils/cn';
import type { ArtifactRow } from '../../types/api';

interface ArtifactHealthRowProps {
  row: ArtifactRow;
  maxSize: number;
  index: number;
}

export function ArtifactHealthRow({ row, maxSize, index }: ArtifactHealthRowProps) {
  const sizePct = maxSize > 0 ? (row.size_mb / maxSize) * 100 : 0;
  const freshness = row.exists ? Math.max(0, Math.min(100, (1 - row.size_mb / (maxSize || 1)) * 100)) : 0;

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      className={!row.exists ? 'bg-sig-critical/5' : 'hover:bg-bg-elevated/50'}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', row.exists ? 'bg-sig-calm' : 'bg-sig-critical')} />
          <span className="text-xs font-medium">{row.exists ? 'Healthy' : 'Missing'}</span>
        </div>
      </td>
      <td className="px-4 py-3 font-medium text-sm">{row.artifact}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-20 overflow-hidden rounded-full bg-bg-canvas">
            <div
              className={cn('h-full rounded-full', row.exists ? 'bg-sig-calm' : 'bg-sig-critical')}
              style={{ width: `${Math.min(100, sizePct)}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-fg-tertiary w-14 text-right">
            {row.exists ? `${row.size_mb.toFixed(2)} MB` : '-'}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-16 overflow-hidden rounded-full bg-bg-canvas">
            <div
              className={cn('h-full rounded-full', freshness > 50 ? 'bg-sig-calm' : freshness > 20 ? 'bg-sig-warn' : 'bg-sig-critical')}
              style={{ width: `${freshness}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-fg-tertiary">{freshness.toFixed(0)}%</span>
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-[10px] text-fg-tertiary max-w-[200px] truncate">{row.path}</td>
    </motion.tr>
  );
}
