import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Crosshair, LineChart, Map, ShieldCheck, Target, Zap } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

const CAPABILITIES = [
  { id: 'canvas', area: 'canvas', route: '/canvas', icon: Map, title: 'Canvas', copy: 'Full-bleed spatial command stage for hotspot selection and layer control.', tone: 'text-sig-cold', surface: 'bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.22),transparent_34%)]' },
  { id: 'forecast', area: 'forecast', route: '/timeline', icon: Clock, title: 'Forecast', copy: 'Horizon matrix for near-term curb pressure and learned signal windows.', tone: 'text-sig-violet', surface: 'bg-[linear-gradient(135deg,rgba(167,139,250,0.18),transparent_52%)]' },
  { id: 'hotspots', area: 'hotspots', route: '/hotspots', icon: Crosshair, title: 'Hotspots', copy: 'Ranked triage for stations, cells, support thresholds, and field pressure.', tone: 'text-sig-warn', surface: 'bg-bg-elevated/70' },
  { id: 'missions', area: 'missions', route: '/missions', icon: Target, title: 'Missions', copy: 'Lifecycle action queue with pin, inspect, copy, and canvas handoff.', tone: 'text-sig-calm', surface: 'bg-[radial-gradient(circle_at_75%_25%,rgba(74,222,128,0.16),transparent_32%)]' },
  { id: 'deployment', area: 'deployment', route: '/deployment', icon: Zap, title: 'Deployment', copy: 'Optimized allocation theatre comparing officer budgets and relief lift.', tone: 'text-accent', surface: 'bg-bg-elevated/70' },
  { id: 'evidence', area: 'evidence', route: '/evidence', icon: LineChart, title: 'Evidence', copy: 'Backtest, ROI, model parameters, feature importance, and artifact readiness.', tone: 'text-sig-cold', surface: 'bg-[linear-gradient(160deg,rgba(56,189,248,0.14),rgba(94,106,210,0.10),transparent_65%)]' },
];

export function CapabilityBentoField() {
  const navigate = useNavigate();

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-fg-primary">Command capabilities</h2>
          <p className="mt-1 max-w-2xl text-sm text-fg-secondary">Six operational surfaces, wired to live ClearLane data.</p>
        </div>
        <ShieldCheck className="hidden h-8 w-8 text-sig-calm md:block" />
      </div>

      <div
        className="grid auto-rows-[170px] grid-cols-1 gap-4 md:grid-cols-4"
        style={{
          gridTemplateAreas: "'canvas canvas forecast hotspots' 'canvas canvas missions deployment' 'evidence evidence missions deployment'",
        }}
      >
        {CAPABILITIES.map((capability) => {
          const Icon = capability.icon;
          return (
            <button
              key={capability.id}
              type="button"
              onClick={() => navigate(capability.route)}
              className={cn(
                'group relative flex min-h-[170px] flex-col overflow-hidden rounded-2xl border border-border-default p-5 text-left shadow-glass transition-all hover:-translate-y-0.5 hover:border-accent/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent',
                capability.surface,
                capability.id === 'canvas' && 'md:[grid-area:canvas]',
                capability.id === 'forecast' && 'md:[grid-area:forecast]',
                capability.id === 'hotspots' && 'md:[grid-area:hotspots]',
                capability.id === 'missions' && 'md:[grid-area:missions]',
                capability.id === 'deployment' && 'md:[grid-area:deployment]',
                capability.id === 'evidence' && 'md:[grid-area:evidence]',
              )}
            >
              <div className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:32px_32px]" />
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl border border-border-default bg-bg-canvas/70', capability.tone)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-fg-primary">{capability.title}</h3>
                  <p className="mt-1 max-w-sm text-sm leading-6 text-fg-secondary">{capability.copy}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
