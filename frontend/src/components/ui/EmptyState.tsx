import React from 'react';
import { cn } from '../../lib/utils/cn';
import { Layers } from 'lucide-react';

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon = <Layers className="w-10 h-10" />, title, description, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col items-center justify-center p-8 text-center', className)}
        {...props}
      >
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-bg-elevated text-fg-tertiary mb-4 shadow-sm hairline-b">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-fg-primary mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-fg-secondary max-w-sm">{description}</p>
        )}
      </div>
    );
  }
);
EmptyState.displayName = 'EmptyState';
