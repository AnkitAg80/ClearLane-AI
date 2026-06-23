import React from 'react';
import { cn } from '../../lib/utils/cn';

interface GlassProps extends React.HTMLAttributes<HTMLDivElement> {
  strong?: boolean;
}

export const Glass = React.forwardRef<HTMLDivElement, GlassProps>(
  ({ className, strong = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          strong ? 'glass-strong' : 'glass',
          className
        )}
        {...props}
      />
    );
  }
);
Glass.displayName = 'Glass';
