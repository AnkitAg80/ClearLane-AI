import React from 'react';
import { Boxes, CheckCircle2, Database, XCircle } from 'lucide-react';
import { useArtifacts } from '../../lib/api/hooks';
import { ArtifactHealthRow } from '../data/ArtifactHealthRow';

function SourceHealthStrip({ healthy, total }: { healthy: number; total: number }) {
  const missing = Math.max(total - healthy, 0);
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-2xl border border-border-default bg-bg-canvas/58 p-4 shadow-glass">
        <Database className="mb-4 h-5 w-5 text-sig-cold" />
        <div className="text-xs text-fg-tertiary">Sources</div>
        <div className="mt-1 font-mono text-3xl text-fg-primary">{total}</div>
      </div>
      <div className="rounded-2xl border border-border-default bg-bg-canvas/58 p-4 shadow-glass">
        <CheckCircle2 className="mb-4 h-5 w-5 text-sig-calm" />
        <div className="text-xs text-fg-tertiary">Healthy</div>
        <div className="mt-1 font-mono text-3xl text-sig-calm">{healthy}</div>
      </div>
      <div className="rounded-2xl border border-border-default bg-bg-canvas/58 p-4 shadow-glass">
        <XCircle className="mb-4 h-5 w-5 text-sig-critical" />
        <div className="text-xs text-fg-tertiary">Missing</div>
        <div className="mt-1 font-mono text-3xl text-sig-critical">{missing}</div>
      </div>
    </div>
  );
}

export function ArtifactDiagnosticsWall() {
  const { data, isLoading } = useArtifacts();
  const rows = data?.artifacts ?? [];
  const healthy = rows.filter((row) => row.exists).length;
  const maxSize = rows.length ? Math.max(...rows.map((a) => a.size_mb), 0.1) : 1;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-fg-primary">Artifact diagnostics wall</h1>
          <p className="mt-1 text-sm text-fg-secondary">SourceHealthStrip first, artifact cards second, dense table after diagnostics.</p>
        </div>
        <Boxes className="hidden h-8 w-8 text-sig-cold md:block" />
      </div>

      <SourceHealthStrip healthy={healthy} total={rows.length} />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-border-default bg-bg-elevated/50" />
          ))
        ) : rows.length ? (
          rows.map((row) => (
            <div key={row.artifact} className="rounded-2xl border border-border-default bg-bg-canvas/58 p-4 shadow-glass">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-fg-primary">{row.artifact}</h2>
                  <p className="mt-1 font-mono text-[11px] text-fg-tertiary">{row.exists ? `${row.size_mb.toFixed(2)} MB` : 'missing'}</p>
                </div>
                {row.exists ? <CheckCircle2 className="h-4 w-4 text-sig-calm" /> : <XCircle className="h-4 w-4 text-sig-critical" />}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-bg-elevated">
                <div className={row.exists ? 'h-full rounded-full bg-sig-calm' : 'h-full rounded-full bg-sig-critical'} style={{ width: row.exists ? `${Math.min(100, (row.size_mb / maxSize) * 100)}%` : '100%' }} />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-border-default p-8 text-center text-sm text-fg-secondary md:col-span-2 xl:col-span-4">
            No artifacts found. Pipeline may be uninitialized.
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-default bg-bg-canvas/58 shadow-glass">
        <table className="w-full min-w-[840px] text-left text-sm">
          <caption className="sr-only">dense table of artifact diagnostics</caption>
          <thead className="sticky top-0 bg-bg-canvas/90 text-xs text-fg-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Artifact Name</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium">Freshness</th>
              <th className="px-4 py-3 font-medium">Path</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-3"><div className="h-4 w-20 rounded bg-bg-elevated" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-32 rounded bg-bg-elevated" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-24 rounded bg-bg-elevated" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-12 rounded bg-bg-elevated" /></td>
                  <td className="px-4 py-3"><div className="h-4 w-48 rounded bg-bg-elevated" /></td>
                </tr>
              ))
            ) : rows.length ? (
              rows.map((row, i) => <ArtifactHealthRow key={row.artifact} row={row} maxSize={maxSize} index={i} />)
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-fg-secondary">No artifacts found. Pipeline may be uninitialized.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
