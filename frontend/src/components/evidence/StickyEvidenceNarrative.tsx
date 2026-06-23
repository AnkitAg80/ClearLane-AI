import React from 'react';
import { BarChart3, Boxes, BrainCircuit, CheckCircle2, LineChart, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { useArtifacts, useEvidence } from '../../lib/api/hooks';
import type { FeatureRow } from '../../types/api';

function formatMetric(value: number | null | undefined, precision = 3) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(precision) : '-';
}

function topFeatures(rows: FeatureRow[] = []) {
  return rows.slice(0, 8);
}

export function StickyEvidenceNarrative() {
  const { data, isLoading } = useEvidence();
  const { data: artifacts } = useArtifacts();
  const readyArtifacts = artifacts?.artifacts?.filter((artifact) => artifact.exists).length ?? 0;
  const totalArtifacts = artifacts?.artifacts?.length ?? 0;
  const regressionRows = data?.feature_importance?.regression ?? [];
  const backtestEntries = Object.entries(data?.backtest ?? {});
  const roiEntries = Object.entries(data?.roi ?? {});

  if (isLoading) {
    return (
      <div className="grid gap-5 lg:grid-cols-[0.36fr_0.64fr]">
        <div className="h-80 animate-pulse rounded-2xl border border-border-default bg-bg-elevated/50" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-48 animate-pulse rounded-2xl border border-border-default bg-bg-elevated/50" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-sig-critical/40 bg-sig-critical/10 p-5 text-sm text-sig-critical">
        Failed to load evidence data.
      </div>
    );
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[0.36fr_0.64fr]">
      <aside className="sticky top-4 self-start rounded-2xl border border-border-default bg-bg-glass/78 p-6 shadow-glass backdrop-blur-xl">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-border-default bg-bg-canvas/75 text-sig-calm">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-fg-primary">
          Evidence attached to every recommendation.
        </h1>
        <p className="mt-4 text-sm leading-6 text-fg-secondary">
          Forecast quality, optimizer lift, model configuration, feature importance, and artifact health stay in one trust narrative.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border-default bg-bg-canvas/60 p-3">
            <div className="text-xs text-fg-tertiary">Backtest</div>
            <div className="mt-1 font-mono text-xl text-sig-calm">{backtestEntries.length}</div>
          </div>
          <div className="rounded-xl border border-border-default bg-bg-canvas/60 p-3">
            <div className="text-xs text-fg-tertiary">Artifacts</div>
            <div className="mt-1 font-mono text-xl text-sig-cold">{readyArtifacts}/{totalArtifacts}</div>
          </div>
        </div>
      </aside>

      <div className="space-y-4">
        <article className="rounded-2xl border border-border-default bg-bg-canvas/58 p-5 shadow-glass backdrop-blur-md">
          <div className="mb-4 flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-sig-calm" />
            <h2 className="text-lg font-semibold text-fg-primary">Backtest</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {backtestEntries.slice(0, 6).map(([key, value]) => (
              <div key={key} className="rounded-xl border border-border-default bg-bg-elevated/45 p-3">
                <div className="truncate text-xs text-fg-tertiary">{key.replace(/_/g, ' ')}</div>
                <div className="mt-2 font-mono text-xl text-fg-primary">{formatMetric(value, 3)}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-border-default bg-bg-canvas/58 p-5 shadow-glass backdrop-blur-md">
          <div className="mb-4 flex items-center gap-3">
            <SlidersHorizontal className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-fg-primary">ROI</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {roiEntries.slice(0, 6).map(([key, value]) => (
              <div key={key} className="rounded-xl border border-border-default bg-bg-elevated/45 p-3">
                <div className="truncate text-xs text-fg-tertiary">{key.replace(/_/g, ' ')}</div>
                <div className="mt-2 font-mono text-xl text-fg-primary">{formatMetric(value, 2)}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="grid gap-4 rounded-2xl border border-border-default bg-bg-canvas/58 p-5 shadow-glass backdrop-blur-md xl:grid-cols-[0.42fr_0.58fr]">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <BrainCircuit className="h-5 w-5 text-sig-violet" />
              <h2 className="text-lg font-semibold text-fg-primary">Model</h2>
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-fg-tertiary">Target</dt>
                <dd className="mt-1 font-mono text-fg-primary">{data.model?.target_column || '-'}</dd>
              </div>
              <div>
                <dt className="text-fg-tertiary">Prediction</dt>
                <dd className="mt-1 font-mono text-fg-primary">{data.model?.prediction_column || '-'}</dd>
              </div>
              <div>
                <dt className="text-fg-tertiary">Ranker</dt>
                <dd className="mt-1 text-fg-primary">{data.model?.ranker_enabled ? 'Enabled' : 'Disabled'}</dd>
              </div>
            </dl>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-fg-primary">Feature importance</h3>
            <div className="space-y-2">
              {topFeatures(regressionRows).map((feature) => (
                <div key={feature.feature} className="grid grid-cols-[1fr_80px] items-center gap-3 text-xs">
                  <span className="truncate font-mono text-fg-secondary">{feature.feature}</span>
                  <span className="text-right font-mono text-fg-primary">{(feature.importance * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-border-default bg-bg-canvas/58 p-5 shadow-glass backdrop-blur-md">
          <div className="mb-4 flex items-center gap-3">
            <LineChart className="h-5 w-5 text-sig-cold" />
            <h2 className="text-lg font-semibold text-fg-primary">Ranker Feature Importance</h2>
          </div>
          <div className="space-y-2">
            {data.feature_importance?.ranker?.slice(0, 10).map((feature) => (
              <div key={feature.feature} className="grid grid-cols-[minmax(0,1fr)_80px] items-center gap-3 rounded-lg border border-border-subtle bg-bg-elevated/35 px-3 py-2 text-xs">
                <span className="truncate font-mono text-fg-secondary">{feature.feature}</span>
                <span className="text-right font-mono text-fg-primary">{(feature.importance * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-border-default bg-bg-canvas/58 p-5 shadow-glass backdrop-blur-md">
          <div className="mb-4 flex items-center gap-3">
            <Boxes className="h-5 w-5 text-sig-warn" />
            <h2 className="text-lg font-semibold text-fg-primary">Artifacts</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {artifacts?.artifacts?.map((artifact) => (
              <div key={artifact.artifact} className="flex items-center justify-between gap-3 rounded-xl border border-border-default bg-bg-elevated/45 p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-fg-primary">{artifact.artifact}</div>
                  <div className="font-mono text-[11px] text-fg-tertiary">{artifact.exists ? `${artifact.size_mb.toFixed(2)} MB` : 'missing'}</div>
                </div>
                {artifact.exists ? <CheckCircle2 className="h-4 w-4 text-sig-calm" /> : <Boxes className="h-4 w-4 text-sig-critical" />}
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
