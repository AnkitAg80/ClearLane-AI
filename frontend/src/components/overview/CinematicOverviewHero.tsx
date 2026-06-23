import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Command, Map } from 'lucide-react';
import { motion } from 'framer-motion';
import { useOverview } from '../../lib/api/hooks';
import { useCommandStore } from '../../stores/useCommandStore';
import { SystemStatusPill } from '../foundation/SystemStatusPill';
import { LiveKpiConstellation } from './LiveKpiConstellation';
import { OperationalMapPreview } from './OperationalMapPreview';

export function CinematicOverviewHero() {
  const navigate = useNavigate();
  const { data, isLoading } = useOverview();
  const openCommandPalette = () => useCommandStore.getState().setOpen(true);
  const summary = data?.summary;

  return (
    <section className="relative grid min-h-[calc(100dvh-9rem)] gap-6 overflow-hidden rounded-2xl border border-border-default bg-bg-canvas/35 p-5 shadow-glass backdrop-blur-md xl:grid-cols-[1.05fr_0.95fr] xl:p-7">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(94,106,210,0.18),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(56,189,248,0.12),transparent_24%)]" />

      <div className="relative z-10 flex min-w-0 flex-col justify-between gap-8">
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-3">
            <SystemStatusPill />
            <span className="rounded-full border border-border-default bg-white/[0.04] px-3 py-1 text-xs text-fg-secondary">
              live command overview
            </span>
          </div>

          <div className="max-w-4xl">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl font-semibold leading-[0.95] tracking-tight text-fg-primary md:text-6xl 2xl:text-7xl"
            >
              ClearLane AI turns curb pressure into deployable field action.
            </motion.h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-fg-secondary">
              Forecast risk, allocate officers, and prove relief from one spatial command surface.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/canvas')}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-white shadow-glass transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              Open canvas
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={openCommandPalette}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border-default bg-white/[0.04] px-5 text-sm font-medium text-fg-primary transition-colors hover:border-accent/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              <Command className="h-4 w-4" />
              Command palette
            </button>
          </div>
        </div>

        <LiveKpiConstellation summary={summary} />
      </div>

      <div className="relative z-10 flex min-w-0 flex-col justify-center">
        {isLoading ? (
          <div className="min-h-[420px] animate-pulse rounded-2xl border border-border-default bg-bg-elevated/60" />
        ) : (
          <OperationalMapPreview
            relief={summary?.expected_relief}
            officers={summary?.officers_deployed}
            cells={summary?.active_cells}
          />
        )}
        <div className="mt-3 flex items-center justify-between rounded-xl border border-border-default bg-bg-glass/70 px-4 py-3 text-xs text-fg-secondary backdrop-blur-xl">
          <span className="inline-flex items-center gap-2">
            <Map className="h-3.5 w-3.5 text-sig-cold" />
            mini operational preview
          </span>
          <span className="font-mono">{data?.bbox ? 'bbox ready' : 'bbox pending'}</span>
        </div>
      </div>
    </section>
  );
}
