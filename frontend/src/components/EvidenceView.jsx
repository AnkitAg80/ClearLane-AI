import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BrainCircuit, Database, LineChart, ShieldCheck } from 'lucide-react';
import MetricCard from './MetricCard';
import Panel from './Panel';

function FeatureChart({ rows }) {
  const data = (rows || []).slice(0, 12).map((row) => ({
    feature: row.feature,
    importance: Number(row.importance || row.gain || row.split || 0),
  }));
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 86, bottom: 8 }}>
        <CartesianGrid stroke="rgba(148, 163, 184, 0.14)" horizontal={false} />
        <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <YAxis dataKey="feature" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={84} />
        <Tooltip cursor={{ fill: 'rgba(6, 182, 212, 0.08)' }} contentStyle={{ background: '#020617', border: '1px solid #334155', color: '#f8fafc' }} />
        <Bar dataKey="importance" fill="#06b6d4" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function EvidenceView({ evidence }) {
  const backtest = evidence?.backtest || {};
  const roi = evidence?.roi || {};
  const model = evidence?.model || {};
  const features = evidence?.feature_importance || {};
  const artifacts = evidence?.artifacts || [];

  return (
    <div className="view-stack">
      <div className="metrics-grid metrics-grid--compact">
        <MetricCard icon={LineChart} label="Top-25 recall" value={Number(backtest.deployment_score_top25_recall || 0).toFixed(3)} tone="success" />
        <MetricCard icon={ShieldCheck} label="NDCG@25" value={Number(backtest.deployment_score_ndcg_at_25 || 0).toFixed(3)} tone="info" />
        <MetricCard icon={BrainCircuit} label="Ranker" value={model.ranker_enabled ? 'Enabled' : 'Disabled'} tone="warning" />
        <MetricCard icon={Database} label="Features" value={(model.features || []).length} />
      </div>

      <div className="two-col">
        <Panel title="Regression Importance" eyebrow={model.prediction_column || 'Prediction'}>
          <FeatureChart rows={features.regression} />
        </Panel>
        <Panel title="Ranker Importance" eyebrow={model.target_column || 'Target'}>
          <FeatureChart rows={features.ranker} />
        </Panel>
      </div>

      <Panel title="Artifact Health" eyebrow={`Lift ${Number(roi.lift_pct || 0).toFixed(1)}%`}>
        <div className="artifact-grid">
          {artifacts.map((item) => (
            <div key={item.artifact} className={`artifact-pill ${item.exists ? 'is-ready' : 'is-missing'}`}>
              <span>{item.artifact}</span>
              <strong>{item.exists ? `${Number(item.size_mb || 0).toFixed(3)} MB` : 'Missing'}</strong>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
