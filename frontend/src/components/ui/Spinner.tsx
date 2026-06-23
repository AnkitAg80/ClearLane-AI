import React from 'react';
import { cn } from '../../lib/utils/cn';

export type SpinnerProps = React.SVGAttributes<SVGSVGElement>;

export const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn('animate-spin text-accent', className)}
        {...props}
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    );
  }
);
Spinner.displayName = 'Spinner';
