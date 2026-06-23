import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '../../lib/utils/cn';

export const TooltipProvider = TooltipPrimitive.Provider;

interface TooltipProps extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root> {
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  className?: string;
}

export function Tooltip({
  children,
  content,
  side = 'top',
  align = 'center',
  sideOffset = 4,
  className,
  ...props
}: TooltipProps) {
  return (
    <TooltipPrimitive.Root {...props}>
      <TooltipPrimitive.Trigger asChild>
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          className={cn(
            'z-[100] overflow-hidden rounded-md border border-border-default bg-bg-elevated px-3 py-1.5 text-xs text-fg-primary shadow-glass animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            className
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-border-default" width={11} height={5} />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
