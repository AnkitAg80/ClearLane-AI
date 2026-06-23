import React from 'react';
import { Stat } from '../../components/ui/Stat';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api/endpoints';
import { qk } from '../../lib/api/queryKeys';
import { AnimatedCounter } from '../../components/foundation/AnimatedCounter';

export function HeroStats() {
  const { data, isLoading } = useQuery({
    queryKey: qk.overview,
    queryFn: api.overview,
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-bg-elevated/50" />
        ))}
      </div>
    );
  }

  const { summary } = data;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <Stat
        label="Officers Deployed"
        value={<AnimatedCounter value={summary.officers_deployed} />}
      />
      <Stat
        label="Active Cells"
        value={<AnimatedCounter value={summary.active_cells} />}
      />
      <Stat
        label="Expected Relief"
        value={<AnimatedCounter value={summary.expected_relief} decimals={1} />}
      />
      <Stat
        label="Lift vs Reactive"
        value={<span>+<AnimatedCounter value={summary.lift_pct} decimals={1} suffix="%" /></span>}
        trend={{ value: summary.lift_pct, isPositive: summary.lift_pct > 0 }}
      />
      <Stat
        label="NDCG@25"
        value={summary.mean_ndcg_at_25 ? <AnimatedCounter value={summary.mean_ndcg_at_25} decimals={3} /> : '-'}
      />
    </div>
  );
}
