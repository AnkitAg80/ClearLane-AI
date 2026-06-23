import React from 'react';
import { motion } from 'framer-motion';
import { Search, Brain, Zap, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STEPS = [
  { icon: Search, label: 'Detect', desc: 'Hotspot identification and signal triage', route: '/hotspots', color: 'text-sig-warn' },
  { icon: Brain, label: 'Analyze', desc: 'Pattern intelligence and criticality scoring', route: '/intelligence', color: 'text-sig-violet' },
  { icon: Zap, label: 'Deploy', desc: 'Optimized allocation with budget constraints', route: '/deployment', color: 'text-sig-calm' },
  { icon: CheckCircle2, label: 'Verify', desc: 'Mission dispatch and relief verification', route: '/missions', color: 'text-sig-cold' },
];

export function OperationalFlowStepper() {
  const navigate = useNavigate();

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-tertiary mb-4">Operations Flow</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.button
              key={step.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              onClick={() => navigate(step.route)}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border-default bg-bg-elevated/50 p-4 text-center transition-all hover:border-accent/50 hover:bg-bg-elevated/80"
            >
              <div className={`rounded-lg border border-border-default bg-bg-canvas p-2.5 ${step.color} group-hover:scale-110 transition-transform`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-fg-primary">{step.label}</div>
                <div className="text-[10px] text-fg-tertiary mt-0.5 leading-relaxed">{step.desc}</div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
