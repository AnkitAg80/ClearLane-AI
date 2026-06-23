import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, CornerDownLeft, MessageSquare, Minus, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { Glass } from '../ui/Glass';
import { useAssistantStore } from '../../stores/useAssistantStore';
import { useFilterStore } from '../../stores/useFilterStore';
import { useOptimizerStore } from '../../stores/useOptimizerStore';
import { useOverview } from '../../lib/api/hooks';
import { cn } from '../../lib/utils/cn';

type AssistantIntent =
  | { intent: 'filter.station'; station: string }
  | { intent: 'navigate'; route: string }
  | { intent: 'optimize'; budget: number | null }
  | { intent: 'explain' }
  | { intent: 'compare' }
  | { intent: 'summarize' };

interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

const ROUTES: Record<string, string> = {
  overview: '/',
  canvas: '/canvas',
  hotspots: '/hotspots',
  timeline: '/timeline',
  intelligence: '/intelligence',
  deployment: '/deployment',
  missions: '/missions',
  evidence: '/evidence',
  artifacts: '/artifacts',
};

function parseUserMessage(text: string): AssistantIntent {
  const normalized = text.trim().toLowerCase();
  const routeKey = Object.keys(ROUTES).find((key) => normalized.includes(key));
  const budgetMatch = normalized.match(/(\d{2,3})\s*(officers|officer|budget)?/);

  if (normalized.includes('station')) {
    return { intent: 'filter.station', station: text.replace(/.*station/i, '').trim() };
  }

  if (normalized.includes('optimize') || normalized.includes('redeploy')) {
    return { intent: 'optimize', budget: budgetMatch ? Number(budgetMatch[1]) : null };
  }

  if (routeKey) {
    return { intent: 'navigate', route: ROUTES[routeKey] };
  }

  if (normalized.includes('compare')) {
    return { intent: 'compare' };
  }

  if (normalized.includes('cii') || normalized.includes('explain')) {
    return { intent: 'explain' };
  }

  return { intent: 'summarize' };
}

export function AssistantDock() {
  const navigate = useNavigate();
  const { open, toggle, setOpen, thread, send } = useAssistantStore();
  const { setStation } = useFilterStore();
  const { setBudget, openOptimizer } = useOptimizerStore();
  const { data } = useOverview();
  const [input, setInput] = React.useState('');

  const messages = thread as AssistantMessage[];

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setOpen]);

  const summarize = React.useCallback(() => {
    const summary = data?.summary;
    if (!summary) return 'I am waiting on live overview data.';

    return `${summary.active_cells} active cells, ${summary.officers_deployed} officers deployed, ${summary.expected_relief.toFixed(1)} expected CII relief, and ${summary.lift_pct.toFixed(1)}% lift versus reactive.`;
  }, [data]);

  const respond = React.useCallback(
    (text: string) => {
      const parsed = parseUserMessage(text);

      if (parsed.intent === 'filter.station') {
        const station = parsed.station || data?.filters?.stations?.[0] || '';
        if (station) setStation(station);
        return station ? `Filtering the workspace to ${station}.` : 'Station data is not loaded yet.';
      }

      if (parsed.intent === 'navigate') {
        navigate(parsed.route);
        return 'Opening that workspace.';
      }

      if (parsed.intent === 'optimize') {
        if (parsed.budget) setBudget(parsed.budget);
        openOptimizer();
        return parsed.budget
          ? `Opening optimizer with ${parsed.budget} officers.`
          : 'Opening the deployment optimizer.';
      }

      if (parsed.intent === 'explain') {
        return 'CII is the curbside intelligence index: a compact score for expected pressure, support, relief potential, and operational priority.';
      }

      if (parsed.intent === 'compare') {
        return 'Open Deployment to compare optimized and reactive allocations side by side with relief and lift metrics.';
      }

      return summarize();
    },
    [data, navigate, openOptimizer, setBudget, setStation, summarize],
  );

  const submit = React.useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      send({ role: 'user', content: trimmed });
      send({ role: 'assistant', content: respond(trimmed) });
      setInput('');
      setOpen(true);
    },
    [respond, send, setOpen],
  );

  if (!open) {
    return (
      <Button
        type="button"
        variant="glass"
        className="fixed bottom-10 right-5 z-40 h-11 gap-2 rounded-full px-4"
        onClick={toggle}
        aria-label="Open assistant"
      >
        <MessageSquare className="h-4 w-4" />
        Sitrep
      </Button>
    );
  }

  return (
    <Glass className="fixed bottom-10 right-5 z-40 flex h-[520px] w-[min(420px,calc(100vw-32px))] flex-col overflow-hidden rounded-xl border border-border-strong">
      <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-accent" />
          <div>
            <div className="text-sm font-semibold">ClearLane Assistant</div>
            <div className="text-[11px] text-fg-tertiary">Deterministic operations helper</div>
          </div>
        </div>
        <button
          type="button"
          className="rounded-md p-1 text-fg-tertiary hover:bg-bg-elevated hover:text-fg-primary"
          onClick={() => setOpen(false)}
          aria-label="Minimize assistant"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="space-y-3 text-sm text-fg-secondary">
            <p>Ask for a sitrep, open a workspace, filter by station, or redeploy an officer budget.</p>
            <div className="flex flex-wrap gap-2">
              {['summarize', 'open deployment', 'redeploy 120 officers'].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="rounded-full border border-border-default px-3 py-1 text-xs text-fg-secondary hover:border-accent hover:text-fg-primary"
                  onClick={() => submit(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={cn(
                'max-w-[86%] rounded-lg px-3 py-2 text-sm',
                message.role === 'user'
                  ? 'ml-auto bg-accent text-white'
                  : 'mr-auto border border-border-default bg-bg-canvas text-fg-secondary',
              )}
            >
              {message.content}
            </div>
          ))
        )}
      </div>

      <form
        className="border-t border-border-default p-3"
        onSubmit={(event) => {
          event.preventDefault();
          submit(input);
        }}
      >
        <div className="flex items-end gap-2 rounded-lg border border-border-default bg-bg-canvas px-3 py-2">
          <CornerDownLeft className="mt-1 h-4 w-4 text-fg-tertiary" />
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={1}
            placeholder="Ask for a sitrep..."
            className="max-h-28 min-h-8 flex-1 resize-none bg-transparent text-sm text-fg-primary outline-none placeholder:text-fg-tertiary"
          />
          <button
            type="submit"
            className="rounded-md bg-accent p-2 text-white hover:bg-accent-hover disabled:opacity-50"
            disabled={!input.trim()}
            aria-label="Send assistant message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </Glass>
  );
}
