import React from 'react';

declare global {
  interface Window {
    mappls?: {
      Map: new (container: string | HTMLElement, options: Record<string, unknown>) => {
        setCenter?: (center: [number, number]) => void;
        setZoom?: (zoom: number) => void;
        setView?: (center: [number, number], zoom: number) => void;
        remove?: () => void;
      };
    };
  }
}

interface MapplsSdkBasemapProps {
  sdkUrls: string[];
  center: [number, number];
  zoom: number;
}

const loadedSdkUrls = new Set<string>();

function loadScript(src: string) {
  if (loadedSdkUrls.has(src)) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
  if (existing) {
    loadedSdkUrls.add(src);
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      loadedSdkUrls.add(src);
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load Mappls SDK: ${src}`));
    document.head.appendChild(script);
  });
}

export function MapplsSdkBasemap({ sdkUrls, center, zoom }: MapplsSdkBasemapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const reactId = React.useId();
  const containerId = React.useMemo(() => `mappls-basemap-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`, [reactId]);
  const mapRef = React.useRef<InstanceType<NonNullable<typeof window.mappls>['Map']> | null>(null);

  React.useEffect(() => {
    if (!containerRef.current || sdkUrls.length === 0) return undefined;
    let cancelled = false;

    async function mountMapplsMap() {
      try {
        for (const sdkUrl of sdkUrls) {
          await loadScript(sdkUrl);
        }
        if (cancelled || !containerRef.current || !window.mappls?.Map || mapRef.current) return;

        mapRef.current = new window.mappls.Map(containerId, {
          center: [center[1], center[0]],
          zoom,
          zoomControl: false,
          hybrid: false,
        });
      } catch (error) {
        console.warn(error);
      }
    }

    mountMapplsMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove?.();
      mapRef.current = null;
    };
  }, [center, containerId, sdkUrls, zoom]);

  React.useEffect(() => {
    function handleView(event: Event) {
      const detail = (event as CustomEvent<{ center?: [number, number]; zoom?: number }>).detail;
      if (!detail?.center || !mapRef.current) return;
      const nextCenter: [number, number] = [detail.center[1], detail.center[0]];
      if (typeof detail.zoom === 'number' && mapRef.current.setView) {
        mapRef.current.setView(nextCenter, detail.zoom);
        return;
      }
      mapRef.current.setCenter?.(nextCenter);
      if (typeof detail.zoom === 'number') {
        mapRef.current.setZoom?.(detail.zoom);
      }
    }

    window.addEventListener('clearlane:map-view', handleView);
    return () => window.removeEventListener('clearlane:map-view', handleView);
  }, []);

  return (
    <div
      ref={containerRef}
      id={containerId}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
