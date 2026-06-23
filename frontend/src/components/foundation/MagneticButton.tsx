import React from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '../../lib/utils/cn';
import { usePrefsStore } from '../../stores/usePrefsStore';

interface MagneticButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
}

export function MagneticButton({ className, variant = 'primary', size = 'md', children, ...props }: MagneticButtonProps) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const reducedMotion = usePrefsStore((s) => s.reducedMotion);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 250, damping: 15, mass: 0.5 });
  const y = useSpring(rawY, { stiffness: 250, damping: 15, mass: 0.5 });

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (reducedMotion || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const nextX = e.clientX - rect.left - rect.width / 2;
      const nextY = e.clientY - rect.top - rect.height / 2;
      rawX.set(nextX * 0.15);
      rawY.set(nextY * 0.15);
    },
    [rawX, rawY, reducedMotion],
  );

  const handleMouseLeave = React.useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={reducedMotion ? undefined : { x, y }}
      whileTap={reducedMotion ? undefined : { scale: 0.97 }}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary' && 'bg-accent text-white hover:bg-accent-hover shadow-sm',
        variant === 'secondary' && 'bg-bg-elevated text-fg-primary border border-border-default hover:bg-bg-elevated/80',
        size === 'sm' && 'h-8 px-3 text-xs',
        size === 'md' && 'h-9 px-4',
        size === 'lg' && 'h-10 px-6',
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
