import React from 'react';
import { cn } from '../../lib/utils/cn';
import { Slot } from '@radix-ui/react-slot';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]',
          {
            'bg-accent text-white hover:bg-accent-hover shadow-sm': variant === 'primary',
            'bg-bg-elevated text-fg-primary border border-border-default hover:bg-bg-elevated/80': variant === 'secondary',
            'hover:bg-bg-elevated text-fg-secondary hover:text-fg-primary': variant === 'ghost',
            'glass text-fg-primary hover:bg-white/10': variant === 'glass',
            'h-8 px-3 text-xs': size === 'sm',
            'h-9 px-4': size === 'md',
            'h-10 px-6': size === 'lg',
            'h-9 w-9': size === 'icon',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
