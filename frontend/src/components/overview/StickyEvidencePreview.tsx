import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Boxes, CheckCircle2, LineChart, SlidersHorizontal } from 'lucide-react';
import { useArtifacts, useEvidence } from '../../lib/api/hooks';

function countReadyArtifacts(artifacts?: { artifacts: { exists: boolean }[] }) {
  return artifacts?.artifacts?.filter((artifact) => artifact.exists).length ?? 0;
}

export function StickyEvidencePreview() {
  const { data: evidence, isLoading } = useEvidence();
  const { data: artifacts } = useArtifacts();
  const navigate = useNavigate();
  const readyArtifacts = countReadyArtifacts(artifacts);
  const totalArtifacts = artifacts?.artifacts?.length ?? 0;

  const panels = [
    {
      icon: BarChart3,
      title: 'Backtest',
      body: evidence?.backtest ? `${Object.keys(evidence.backtest).length} validation metrics loaded` : 'Backtest pending',
      tone: 'text-sig-calm',
    },
    {
      icon: SlidersHorizontal,
      title: 'Optimizer',
      body: evidence?.roi ? `${Object.keys(evidence.roi).length} ROI fields available` : 'ROI evidence pending',
      tone: 'text-accent',
    },
    {
      icon: LineChart,
      title: 'Feature importance',
      body: evidence?.feature_importance?.ranker?.length ? `${evidence.feature_importance.ranker.length} ranker signals` : 'Ranker signals pending',
      tone: 'text-sig-cold',
    },
    {
      icon: Boxes,
      title: 'Artifacts',
      body: totalArtifacts ? `${readyArtifacts}/${totalArtifacts} artifacts ready` : 'Artifact inventory pending',
      tone: readyArtifacts === totalArtifacts && totalArtifacts > 0 ? 'text-sig-calm' : 'text-sig-warn',
    },
  ];

  return (
    <section className="grid gap-5 lg:grid-cols-[0.42fr_0.58fr]">
      <div className="sticky top-4 self-start rounded-2xl border border-border-default bg-bg-glass/75 p-5 shadow-glass backdrop-blur-xl">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-border-default bg-bg-canvas/75 text-sig-calm">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-fg-primary">Evidence stays attached to every command.</h2>
        <p className="mt-3 text-sm leading-6 text-fg-secondary">
          Forecast, deployment, backtest, and artifacts appear before operators need to trust an action.
        </p>
        <button
          type="button"
          onClick={() => navigate('/evidence')}
          className="mt-5 rounded-full border border-border-default bg-white/[0.04] px-4 py-2 text-sm text-fg-primary transition-colors hover:border-accent/60"
        >
          open evidence
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-xl border border-border-default bg-bg-elevated/50" />
          ))
        ) : (
          panels.map((panel) => {
            const Icon = panel.icon;
            return (
              <div key={panel.title} className="min-h-36 rounded-xl border border-border-default bg-bg-elevated/55 p-4 shadow-glass">
                <Icon className={`mb-5 h-5 w-5 ${panel.tone}`} />
                <h3 className="text-sm font-semibold text-fg-primary">{panel.title}</h3>
                <p className="mt-2 text-sm leading-6 text-fg-secondary">{panel.body}</p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
