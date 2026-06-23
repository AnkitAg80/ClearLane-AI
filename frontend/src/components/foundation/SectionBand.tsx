import React from 'react';
import { cn } from '../../lib/utils/cn';

interface SectionBandProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'glass';
}

export function SectionBand({ className, variant = 'default', children, ...props }: SectionBandProps) {
  return (
    <section
      className={cn(
        'rounded-xl border',
        variant === 'default' && 'border-border-default bg-bg-elevated/50',
        variant === 'glass' && 'border-border-default bg-bg-glass backdrop-blur-md',
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}
