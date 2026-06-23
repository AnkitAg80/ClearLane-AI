import React from 'react';
import { cn } from '../../lib/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent',
          {
            'border-transparent bg-bg-elevated text-fg-primary': variant === 'default',
            'border-transparent bg-sig-calm/10 text-sig-calm': variant === 'success',
            'border-transparent bg-sig-warn/10 text-sig-warn': variant === 'warning',
            'border-transparent bg-sig-critical/10 text-sig-critical': variant === 'danger',
            'border-transparent bg-sig-cold/10 text-sig-cold': variant === 'info',
            'border-border-default text-fg-secondary': variant === 'outline',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';
