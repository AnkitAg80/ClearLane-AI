import React from 'react';
import { motion } from 'framer-motion';
import { Crosshair, Clock, ShieldAlert, Zap, Target, LineChart, Database, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BentoGrid, BentoCard } from '../foundation/BentoGrid';

const CAPABILITIES = [
  { route: '/canvas', icon: Map, label: 'Live Canvas', desc: 'Full-bleed operational map with extruded hotspots and predictive layers', color: 'text-sig-cold' },
  { route: '/hotspots', icon: Crosshair, label: 'Hotspot Triage', desc: 'Ranked, filterable list of active and emerging hotspots', color: 'text-sig-warn' },
  { route: '/timeline', icon: Clock, label: 'Forecast Horizon', desc: 'Predictive matrix showing CII trends across near-term windows', color: 'text-sig-violet' },
  { route: '/intelligence', icon: ShieldAlert, label: 'Pattern Intelligence', desc: 'Lifecycle tracking, capacity theft, and criticality analysis', color: 'text-sig-critical' },
  { route: '/deployment', icon: Zap, label: 'Deployment Optimizer', desc: 'Optimized vs reactive allocation with ROI lift', color: 'text-sig-calm' },
  { route: '/missions', icon: Target, label: 'Mission Dispatch', desc: 'Lifecycle-grouped action queue with quick operations', color: 'text-sig-warn' },
  { route: '/evidence', icon: LineChart, label: 'Evidence & Models', desc: 'Backtest, ROI, model params, and feature importance', color: 'text-sig-cold' },
  { route: '/artifacts', icon: Database, label: 'Artifact Monitor', desc: 'System health and data pipeline diagnostics', color: 'text-fg-tertiary' },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export function CapabilityBentoGrid() {
  const navigate = useNavigate();

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight mb-4">Capabilities</h2>
      <motion.div variants={container} initial="hidden" animate="show">
        <BentoGrid cols={4}>
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <motion.div key={cap.route} variants={itemVariants}>
                <BentoCard
                  className="p-4 flex flex-col gap-3 h-full"
                  onClick={() => navigate(cap.route)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && navigate(cap.route)}
                >
                  <div className={`w-9 h-9 rounded-lg bg-bg-canvas border border-border-default flex items-center justify-center ${cap.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-fg-primary group-hover/card:text-accent transition-colors">{cap.label}</div>
                    <div className="text-[11px] text-fg-tertiary mt-0.5 leading-relaxed">{cap.desc}</div>
                  </div>
                </BentoCard>
              </motion.div>
            );
          })}
        </BentoGrid>
      </motion.div>
    </div>
  );
}
