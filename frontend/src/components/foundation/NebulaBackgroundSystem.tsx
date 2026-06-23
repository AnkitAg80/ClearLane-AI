import React from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils/cn';
import { usePrefsStore } from '../../stores/usePrefsStore';
import { NoiseOverlay } from './NoiseOverlay';

interface RouteAtmosphere {
  glow: string;
  contourA: string;
  contourB: string;
  gridOpacity: number;
  contourOpacity: number;
}

function routeAtmosphere(pathname: string): RouteAtmosphere {
  if (pathname === '/') {
    return {
      glow: 'rgba(56, 189, 248, 0.20)',
      contourA: 'rgba(94, 106, 210, 0.22)',
      contourB: 'rgba(74, 222, 128, 0.12)',
      gridOpacity: 0.28,
      contourOpacity: 0.82,
    };
  }

  if (pathname.startsWith('/canvas')) {
    return {
      glow: 'rgba(56, 189, 248, 0.08)',
      contourA: 'rgba(56, 189, 248, 0.10)',
      contourB: 'rgba(94, 106, 210, 0.08)',
      gridOpacity: 0.14,
      contourOpacity: 0.28,
    };
  }

  if (pathname.startsWith('/deployment') || pathname.startsWith('/evidence')) {
    return {
      glow: 'rgba(167, 139, 250, 0.15)',
      contourA: 'rgba(167, 139, 250, 0.18)',
      contourB: 'rgba(255, 179, 71, 0.10)',
      gridOpacity: 0.22,
      contourOpacity: 0.62,
    };
  }

  if (pathname.startsWith('/hotspots') || pathname.startsWith('/timeline')) {
    return {
      glow: 'rgba(255, 179, 71, 0.10)',
      contourA: 'rgba(255, 179, 71, 0.10)',
      contourB: 'rgba(56, 189, 248, 0.08)',
      gridOpacity: 0.18,
      contourOpacity: 0.34,
    };
  }

  return {
    glow: 'rgba(94, 106, 210, 0.12)',
    contourA: 'rgba(94, 106, 210, 0.14)',
    contourB: 'rgba(74, 222, 128, 0.08)',
    gridOpacity: 0.20,
    contourOpacity: 0.46,
  };
}

function VoidField({ atmosphere }: { atmosphere: RouteAtmosphere }) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background:
          `radial-gradient(circle at 18% 14%, ${atmosphere.glow}, transparent 30%), ` +
          'radial-gradient(circle at 82% 8%, rgba(74, 222, 128, 0.07), transparent 28%), ' +
          'linear-gradient(135deg, #05060a 0%, #080a10 42%, #0b0d14 100%)',
      }}
      aria-hidden="true"
    />
  );
}

function GeoGridField({ atmosphere }: { atmosphere: RouteAtmosphere }) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        opacity: atmosphere.gridOpacity,
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), ' +
          'linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px), ' +
          'linear-gradient(rgba(56,189,248,0.08) 1px, transparent 1px), ' +
          'linear-gradient(90deg, rgba(56,189,248,0.06) 1px, transparent 1px)',
        backgroundSize: '96px 96px, 96px 96px, 24px 24px, 24px 24px',
        maskImage: 'radial-gradient(circle at 50% 35%, black 0%, transparent 74%)',
        WebkitMaskImage: 'radial-gradient(circle at 50% 35%, black 0%, transparent 74%)',
      }}
      aria-hidden="true"
    />
  );
}

function SignalContours({ atmosphere, reducedMotion }: { atmosphere: RouteAtmosphere; reducedMotion: boolean }) {
  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-0 z-0 mix-blend-screen blur-3xl transition-opacity duration-700',
        !reducedMotion && 'motion-safe:animate-pulse',
      )}
      style={{
        opacity: atmosphere.contourOpacity,
        background:
          `radial-gradient(ellipse at 20% 72%, ${atmosphere.contourA}, transparent 38%), ` +
          `radial-gradient(ellipse at 82% 62%, ${atmosphere.contourB}, transparent 36%), ` +
          'radial-gradient(ellipse at 48% 18%, rgba(255,255,255,0.05), transparent 24%)',
      }}
      aria-hidden="true"
    />
  );
}

export function NebulaBackgroundSystem() {
  const { pathname } = useLocation();
  const reducedMotion = usePrefsStore((state) => state.reducedMotion);
  const atmosphere = routeAtmosphere(pathname);

  return (
    <>
      <VoidField atmosphere={atmosphere} />
      <GeoGridField atmosphere={atmosphere} />
      <SignalContours atmosphere={atmosphere} reducedMotion={reducedMotion} />
      <NoiseOverlay />
    </>
  );
}
