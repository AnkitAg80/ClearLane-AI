import React from 'react';
import { cn } from '../../lib/utils/cn';
import { Card } from './Card';

interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
}

export const Stat = React.forwardRef<HTMLDivElement, StatProps>(
  ({ className, label, value, trend, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn('p-4 flex flex-col gap-2 transition-all hover:bg-bg-elevated/90 hover:-translate-y-[1px]', className)}
        {...props}
      >
        <div className="text-sm text-fg-secondary font-medium">{label}</div>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-tabular font-semibold text-fg-primary tracking-tight">
            {value}
          </div>
          {trend && (
            <div
              className={cn(
                'text-xs font-medium px-1.5 py-0.5 rounded-full',
                trend.isPositive ? 'bg-sig-calm/10 text-sig-calm' : 'bg-sig-critical/10 text-sig-critical'
              )}
            >
              {trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}
            </div>
          )}
        </div>
      </Card>
    );
  }
);
Stat.displayName = 'Stat';
