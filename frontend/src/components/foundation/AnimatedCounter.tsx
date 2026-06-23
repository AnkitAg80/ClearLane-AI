import React from 'react';
import { useInView } from 'framer-motion';
import { usePrefsStore } from '../../stores/usePrefsStore';

interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

export function AnimatedCounter({ value, decimals = 0, suffix = '', prefix = '', duration = 0.8 }: AnimatedCounterProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const [displayed, setDisplayed] = React.useState(0);
  const reducedMotion = usePrefsStore((state) => state.reducedMotion);

  React.useEffect(() => {
    if (reducedMotion || !isInView) return;
    let startTime: number | null = null;
    let frame = 0;
    const from = 0;
    const to = value;

    function animate(time: number) {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(from + (to - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isInView, value, duration, reducedMotion]);

  const visibleValue = reducedMotion ? value : displayed;

  return (
    <span ref={ref} className="font-tabular">
      {prefix}{visibleValue.toFixed(decimals)}{suffix}
    </span>
  );
}
