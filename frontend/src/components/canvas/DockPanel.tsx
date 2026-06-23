import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Minus, GripHorizontal } from 'lucide-react';
import { Glass } from '../ui/Glass';
import { useCanvasStore, type PanelId, type DockLocation } from '../../stores/useCanvasStore';
import { cn } from '../../lib/utils/cn';
import { usePrefsStore } from '../../stores/usePrefsStore';

interface DockPanelProps {
  id: PanelId;
  title: string;
  children: React.ReactNode;
  defaultWidth?: number;
  className?: string;
}

const RAIL_ZONES = {
  'left-rail': { x: 16, y: 80 },
  'right-rail': { x: window.innerWidth - 340, y: 80 },
  'bottom-rail': { x: window.innerWidth / 2 - 160, y: window.innerHeight - 120 },
};

function getNearestRail(x: number, y: number): DockLocation | null {
  const threshold = 80;
  const w = window.innerWidth;
  const h = window.innerHeight;

  if (x < threshold) return 'left-rail';
  if (x > w - 340 - threshold) return 'right-rail';
  if (y > h - 160 - threshold) return 'bottom-rail';
  return null;
}

export function DockPanel({ id, title, children, defaultWidth = 320, className }: DockPanelProps) {
  const { panels, dockPanel, movePanel, togglePanel } = useCanvasStore();
  const reducedMotion = usePrefsStore((s) => s.reducedMotion);
  const panel = panels[id];
  const isMinimized = panel?.minimized ?? false;
  const location = panel?.location ?? 'floating';
  const savedPos = panel?.position ?? { x: 40, y: 40 };

  const [isDragging, setIsDragging] = React.useState(false);

  const x = useMotionValue(location === 'floating' ? savedPos.x : (RAIL_ZONES[location]?.x ?? 16));
  const y = useMotionValue(location === 'floating' ? savedPos.y : (RAIL_ZONES[location]?.y ?? 80));
  const scale = useTransform(x, () => (isDragging ? 1.02 : 1));

  const handleDragEnd = React.useCallback(
    () => {
      setIsDragging(false);
      const finalX = x.get();
      const finalY = y.get();
      const nearest = getNearestRail(finalX, finalY);
      if (nearest) {
        dockPanel(id, nearest);
      } else {
        dockPanel(id, 'floating');
        movePanel(id, { x: finalX, y: finalY });
      }
    },
    [id, dockPanel, movePanel, x, y],
  );

  if (!panel) return null;

  return (
    <motion.div
      drag={!reducedMotion}
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      style={{ x, y, scale }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'fixed z-20 select-none',
        isMinimized && 'pointer-events-auto',
        className,
      )}
    >
      <Glass
        className={cn(
          'overflow-hidden rounded-xl border border-border-strong shadow-glass-strong transition-shadow',
          isDragging && 'shadow-glass shadow-accent/20',
          isMinimized ? 'w-auto' : `w-[${defaultWidth}px]`,
        )}
      >
        <div
          className={cn(
            'flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing hairline-b border-border-default',
            isDragging && 'cursor-grabbing',
          )}
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-fg-secondary">
            <GripHorizontal className="h-3 w-3 text-fg-tertiary" />
            {title}
          </div>
          <button
            type="button"
            onClick={() => togglePanel(id)}
            className="rounded p-0.5 text-fg-tertiary hover:text-fg-primary hover:bg-bg-elevated transition-colors"
            aria-label={isMinimized ? `Expand ${title}` : `Minimize ${title}`}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
        </div>
        {!isMinimized && (
          <div className="p-3 max-h-[60vh] overflow-y-auto">{children}</div>
        )}
      </Glass>
    </motion.div>
  );
}
