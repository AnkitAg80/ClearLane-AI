import React from 'react';
import { cn } from '../../lib/utils/cn';

interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 2 | 3 | 4;
}

export function BentoGrid({ className, cols = 3, ...props }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4',
        {
          'grid-cols-1 md:grid-cols-2': cols === 2,
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3': cols === 3,
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-4': cols === 4,
        },
        className,
      )}
      {...props}
    />
  );
}

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: 1 | 2;
  rowSpan?: 1 | 2;
  interactive?: boolean;
}

export function BentoCard({ className, span = 1, rowSpan = 1, interactive = true, ...props }: BentoCardProps) {
  return (
    <div
      className={cn(
        'group/card relative overflow-hidden rounded-xl border border-border-default bg-bg-elevated/80 shadow-sm',
        span === 2 && 'md:col-span-2',
        rowSpan === 2 && 'md:row-span-2',
        interactive && 'transition-all hover:border-border-strong hover:shadow-glass hover:-translate-y-[1px] cursor-pointer',
        className,
      )}
      {...props}
    />
  );
}
