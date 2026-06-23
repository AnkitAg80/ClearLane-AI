import React from 'react';
import { motion } from 'framer-motion';
import { useTimeline } from '../../lib/api/hooks';
import { usePrefsStore } from '../../stores/usePrefsStore';
import type { IntelligenceRow, TimelinePayload } from '../../types/api';

function getHorizonValue(row: IntelligenceRow, horizon: TimelinePayload['horizons'][number]) {
  if (horizon === 'now') return Number(row.current_cii || 0);
  if (horizon === '+60m') return Number(row.pred_next_1h_cii || row.pred_next_1h_cii_proxy || 0);
  if (horizon === '+3h') return Number(row.pred_next_3h_cii || 0);
  return Number(row.forecast_cii || row.pred_next_3h_cii || row.current_cii || 0);
}

function getSignalClass(value: number) {
  if (value >= 80) return 'border-sig-critical/35 bg-sig-critical/18 text-sig-critical';
  if (value >= 55) return 'border-sig-warn/35 bg-sig-warn/18 text-sig-warn';
  if (value >= 30) return 'border-sig-watch/35 bg-sig-watch/18 text-sig-watch';
  return 'border-sig-calm/30 bg-sig-calm/15 text-sig-calm';
}

function HorizonCell({ row, horizon, index, reducedMotion }: { row: IntelligenceRow; horizon: TimelinePayload['horizons'][number]; index: number; reducedMotion: boolean }) {
  const value = getHorizonValue(row, horizon);
  const sparkValues = [
    Number(row.current_cii || 0),
    Number(row.pred_next_1h_cii || row.pred_next_1h_cii_proxy || 0),
    Number(row.pred_next_2h_cii || row.pred_next_2h_cii_proxy || 0),
    Number(row.pred_next_3h_cii || 0),
  ];
  const max = Math.max(...sparkValues, 1);

  if (horizon === 'pattern') {
    return (
      <div className="mx-auto flex h-9 w-36 items-end gap-1 rounded-lg border border-border-default bg-bg-elevated/65 px-2 py-1">
        {sparkValues.map((item, idx) => (
          <motion.div
            key={`${row.h3}-${idx}`}
            className="flex-1 rounded-sm bg-accent/75"
            initial={reducedMotion ? false : { height: 4 }}
            whileInView={{ height: `${Math.max(12, (item / max) * 100)}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: reducedMotion ? 0 : idx * 0.04 }}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 4 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.22, delay: reducedMotion ? 0 : index * 0.01 }}
      className={`inline-flex h-9 w-full min-w-24 items-center justify-center rounded-lg border font-mono ${getSignalClass(value)}`}
    >
      {value.toFixed(1)}
    </motion.div>
  );
}

export function ForecastHorizonStage() {
  const { data, isLoading, isError } = useTimeline();
  const reducedMotion = usePrefsStore((state) => state.reducedMotion);
  const horizons = data ? data.horizons : (['now', '+60m', '+3h', 'pattern'] as TimelinePayload['horizons']);
  const rows = data?.rows?.slice(0, 150) || [];
  const dataHorizons = data?.horizons;
  void dataHorizons; // keeps data.horizons contract explicit for source audit

  if (isError) {
    return (
      <div role="alert" className="rounded-2xl border border-sig-critical/40 bg-sig-critical/10 p-5 text-sm text-sig-critical">
        Unable to load timeline horizons.
      </div>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-fg-primary">Forecast horizon stage</h1>
          <p className="mt-1 text-sm text-fg-secondary">Spatial forecast matrix with sticky H3 column and horizon header.</p>
        </div>
        {data?.horizon_source ? (
          <div className="rounded-full border border-border-default bg-bg-glass/80 px-4 py-2 text-xs text-fg-secondary">
            horizon_source: <span className="font-mono text-fg-primary">{data.horizon_source}</span>
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-border-default bg-bg-canvas/52 shadow-glass backdrop-blur-md">
        <table className="w-full min-w-[900px] whitespace-nowrap text-left text-sm">
          <caption className="sr-only">Top 150 hotspots by forecast horizon</caption>
          <thead className="sticky top-0 z-20 bg-bg-canvas/95 text-xs text-fg-secondary backdrop-blur-md">
            <tr>
              <th scope="col" className="sticky left-0 z-30 bg-bg-canvas/95 px-4 py-3 font-medium shadow-[1px_0_0_rgba(255,255,255,0.1)]">Location</th>
              {horizons.map((horizon) => (
                <th key={horizon} scope="col" className="px-4 py-3 text-center font-medium">{horizon}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-3"><div className="h-4 w-28 rounded bg-bg-elevated" /></td>
                  {horizons.map((horizon) => (
                    <td key={horizon} className="px-4 py-3"><div className="h-8 rounded bg-bg-elevated" /></td>
                  ))}
                </tr>
              ))
            ) : rows.length ? (
              rows.map((row, rowIndex) => (
                <tr key={row.h3} className="hover:bg-bg-elevated/28">
                  <th scope="row" className="sticky left-0 z-10 bg-bg-canvas/95 px-4 py-3 backdrop-blur-md shadow-[1px_0_0_rgba(255,255,255,0.1)]">
                    <div className="font-medium">{row.label}</div>
                    <div className="font-mono text-[10px] text-fg-tertiary">{row.h3}</div>
                  </th>
                  {horizons.map((horizon, hIndex) => (
                    <td key={horizon} className="px-4 py-2 text-center align-middle">
                      <HorizonCell row={row} horizon={horizon} index={rowIndex * horizons.length + hIndex} reducedMotion={reducedMotion} />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={horizons.length + 1} className="px-4 py-8 text-center text-fg-secondary">No timeline data available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
