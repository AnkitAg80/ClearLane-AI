import React, { useId } from 'react';

export function GeoGridBackdrop() {
  const id = useId();

  return (
    <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]" aria-hidden="true">
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={`grid-${id}`} width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
          <pattern id={`dot-${id}`} width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.8" fill="currentColor" />
          </pattern>
          <radialGradient id={`glow-${id}`} cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(94, 106, 210, 0.08)" />
            <stop offset="100%" stopColor="rgba(94, 106, 210, 0)" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${id})`} />
        <rect width="100%" height="100%" fill={`url(#dot-${id})`} />
        <rect width="100%" height="100%" fill={`url(#glow-${id})`} />
      </svg>
    </div>
  );
}
