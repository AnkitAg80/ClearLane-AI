import React from 'react';
import { cn } from '../../lib/utils/cn';
import { usePrefsStore } from '../../stores/usePrefsStore';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function SpotlightCard({ className, children, ...props }: SpotlightCardProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefsStore((s) => s.reducedMotion);
  const [spotlight, setSpotlight] = React.useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (reducedMotion || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setSpotlight({ x, y, opacity: 1 });
    },
    [reducedMotion],
  );

  const handleMouseLeave = React.useCallback(() => {
    setSpotlight((prev) => ({ ...prev, opacity: 0 }));
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 -z-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at ${spotlight.x}% ${spotlight.y}%, rgba(94, 106, 210, 0.08), transparent 60%)`,
          opacity: spotlight.opacity,
        }}
        aria-hidden="true"
      />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
