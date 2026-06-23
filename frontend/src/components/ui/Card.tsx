import React from 'react';
import { cn } from '../../lib/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, glass = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border border-border-default bg-bg-elevated/80 shadow-sm overflow-hidden',
          glass && 'glass',
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';
