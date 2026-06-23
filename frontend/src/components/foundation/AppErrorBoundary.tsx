import React from 'react';
import { AlertTriangle, Home, RefreshCcw, Trash2 } from 'lucide-react';
import { useNavigate, useRouteError } from 'react-router-dom';
import { Button } from '../ui/Button';

function formatError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'The route failed to render.';
}

export function AppErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  const clearMapState = React.useCallback(() => {
    localStorage.removeItem('canvas-storage');
    window.location.reload();
  }, []);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg-canvas px-5 text-fg-primary">
      <div className="w-full max-w-xl rounded-xl border border-border-default bg-bg-elevated p-6 shadow-glass">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-sig-critical/40 bg-sig-critical/10 text-sig-critical">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-fg-primary">Command surface recovered</h1>
            <p className="mt-2 text-sm leading-6 text-fg-secondary">
              A route crashed before it could finish rendering. You can reload the route or clear saved canvas layer state.
            </p>
            <pre className="mt-4 max-h-32 overflow-auto rounded-lg border border-border-subtle bg-bg-canvas p-3 text-xs text-fg-tertiary">
              {formatError(error)}
            </pre>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" variant="primary" onClick={() => window.location.reload()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reload route
          </Button>
          <Button type="button" variant="secondary" onClick={clearMapState}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear map layer state
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/')}>
            <Home className="mr-2 h-4 w-4" />
            Open overview
          </Button>
        </div>
      </div>
    </div>
  );
}
