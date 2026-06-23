import React from 'react';
import { cn } from '../../lib/utils/cn';

export type KbdProps = React.HTMLAttributes<HTMLElement>;

export const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, ...props }, ref) => {
    return (
      <kbd
        ref={ref}
        className={cn(
          'pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border-strong bg-bg-canvas px-1.5 font-mono text-[10px] font-medium text-fg-secondary',
          className
        )}
        {...props}
      />
    );
  }
);
Kbd.displayName = 'Kbd';
