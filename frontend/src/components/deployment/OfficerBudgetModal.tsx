import React from 'react';
import { Loader2, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
} from '../ui/Modal';
import { Button } from '../ui/Button';
import { useDeployment, useOptimizeMutation, useOverview } from '../../lib/api/hooks';
import { useOptimizerStore } from '../../stores/useOptimizerStore';
import { cn } from '../../lib/utils/cn';

const MIN_BUDGET = 0;
const SLIDER_MAX_BUDGET = 500;

export function OfficerBudgetModal() {
  const { open, budget, presets, setBudget, setOpen, closeOptimizer } = useOptimizerStore();
  const { data } = useOverview();
  const { data: deployment } = useDeployment();
  const optimize = useOptimizeMutation();

  React.useEffect(() => {
    if (open && data?.summary?.officers_deployed) {
      setBudget(data.summary.officers_deployed);
    }
  }, [data, open, setBudget]);

  const prevRelief = deployment?.totals?.optimized_relief;
  const prevLift = deployment?.totals?.lift_pct;
  const normalizedBudget = Number.isFinite(budget) ? Math.max(MIN_BUDGET, Math.floor(budget)) : MIN_BUDGET;
  const sliderBudget = Math.min(SLIDER_MAX_BUDGET, normalizedBudget);

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalContent className="max-w-xl">
        <ModalHeader>
          <ModalTitle>Re-optimize Deployment</ModalTitle>
          <ModalDescription>
            Set any non-negative officer budget and refresh all dependent operational views.
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-5">
          <div className="rounded-lg border border-border-default bg-bg-canvas p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-fg-secondary">Officer budget</span>
              <span className="font-tabular text-2xl font-semibold text-fg-primary">{normalizedBudget}</span>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_150px]">
              <label className="min-w-0">
                <span className="mb-1 block text-xs text-fg-tertiary">Quick adjust 0-500</span>
                <input
                  type="range"
                  min={MIN_BUDGET}
                  max={SLIDER_MAX_BUDGET}
                  step={10}
                  value={sliderBudget}
                  onChange={(event) => setBudget(Number(event.target.value))}
                  className="w-full accent-accent"
                  aria-label="Officer budget"
                />
              </label>
              <label>
                <span className="mb-1 block text-xs text-fg-tertiary">Type any number</span>
                <input
                  type="number"
                  min={MIN_BUDGET}
                  value={normalizedBudget}
                  onChange={(event) => setBudget(Number(event.target.value))}
                  aria-label="Type officer budget"
                  className="h-9 w-full rounded-md border border-border-default bg-bg-elevated px-3 font-mono text-sm text-fg-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
              </label>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                className="rounded-md border border-border-default p-2 text-fg-secondary hover:text-fg-primary"
                onClick={() => setBudget(Math.max(MIN_BUDGET, normalizedBudget - 10))}
                aria-label="Decrease officer budget"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="min-w-0 flex-1 rounded-md border border-border-subtle bg-bg-elevated/50 px-3 py-2 text-xs text-fg-secondary">
                Slider is a quick control. Typed budgets can exceed 500.
              </div>
              <button
                type="button"
                className="rounded-md border border-border-default p-2 text-fg-secondary hover:text-fg-primary"
                onClick={() => setBudget(normalizedBudget + 10)}
                aria-label="Increase officer budget"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setBudget(preset)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs transition-colors',
                    preset === normalizedBudget
                      ? 'border-accent bg-accent text-white'
                      : 'border-border-default text-fg-secondary hover:text-fg-primary',
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border-default bg-bg-canvas/60 p-3 text-sm text-fg-secondary">
            Submitting invalidates overview, map, hotspots, deployment, intelligence, timeline, and missions data.
          </div>

          {optimize.error ? (
            <div role="alert" className="rounded-lg border border-sig-critical/40 bg-sig-critical/10 p-3 text-sm text-sig-critical">
              {(optimize.error as Error).message || 'Optimization failed.'}
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={closeOptimizer}>
              Cancel
            </Button>
            <Button
              type="button"
              className="gap-2"
              disabled={optimize.isPending}
              onClick={() =>
                optimize.mutate(
                  { officer_budget: normalizedBudget },
                  {
                    onSuccess: (result) => {
                      closeOptimizer();
                      const newRelief = result?.totals?.optimized_relief;
                      const newLift = result?.totals?.lift_pct;
                      const reliefDelta = prevRelief != null && newRelief != null ? newRelief - prevRelief : 0;
                      const liftDelta = prevLift != null && newLift != null ? newLift - prevLift : 0;
                      const parts: string[] = ['Optimization complete'];
                      if (reliefDelta) parts.push(`Relief ${reliefDelta > 0 ? '+' : ''}${reliefDelta.toFixed(1)}`);
                      if (liftDelta) parts.push(`Lift ${liftDelta > 0 ? '+' : ''}${liftDelta.toFixed(1)}%`);
                      toast.success(parts.join(' | '));
                      if (result.unused_officers > 0) {
                        toast.warning(`Only ${result.allocated_officers} officers produced useful relief. ${result.unused_officers} remained unused.`);
                      }
                    },
                  },
                )
              }
            >
              {optimize.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Optimize
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
