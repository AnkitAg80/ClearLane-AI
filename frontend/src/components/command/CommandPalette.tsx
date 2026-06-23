import React from 'react';
import { motion } from 'framer-motion';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  Eraser,
  Gauge,
  LayoutDashboard,
  Map,
  Moon,
  Navigation,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { useCommandStore } from '../../stores/useCommandStore';
import { useFilterStore } from '../../stores/useFilterStore';
import { useOptimizerStore } from '../../stores/useOptimizerStore';
import { usePrefsStore } from '../../stores/usePrefsStore';
import { useOverview } from '../../lib/api/hooks';

interface CommandItem {
  id: string;
  group: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
  run: () => void;
}

const commandListVariants = {
  hidden: { opacity: 1 },
  open: { opacity: 1, transition: { staggerChildren: 0.025 } },
};

const commandItemVariants = {
  hidden: { opacity: 0, y: 6 },
  open: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export function CommandPalette() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { open, setOpen, query, setQuery, addRecent } = useCommandStore();
  const { reset, setStation, setMinSupport } = useFilterStore();
  const { openOptimizer, setBudget } = useOptimizerStore();
  const { toggleMotion, toggleDensity } = usePrefsStore();
  const { data } = useOverview();

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(!open);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, setOpen]);

  const closeAfter = React.useCallback(
    (item: CommandItem) => {
      item.run();
      addRecent(item.id);
      setQuery('');
      setOpen(false);
    },
    [addRecent, setOpen, setQuery],
  );

  const firstStation = data?.filters?.stations?.[0];
  const commands: CommandItem[] = [
    {
      id: 'go-overview',
      group: 'Navigation',
      label: 'Go to Overview',
      hint: '/',
      icon: <LayoutDashboard className="h-4 w-4" />,
      run: () => navigate('/'),
    },
    {
      id: 'go-canvas',
      group: 'Navigation',
      label: 'Go to Canvas',
      hint: 'g c',
      icon: <Map className="h-4 w-4" />,
      run: () => navigate('/canvas'),
    },
    {
      id: 'go-deployment',
      group: 'Navigation',
      label: 'Go to Deployment',
      hint: 'g d',
      icon: <Navigation className="h-4 w-4" />,
      run: () => navigate('/deployment'),
    },
    {
      id: 'filter-station',
      group: 'Filters',
      label: 'Filter by station',
      hint: firstStation || 'needs station data',
      icon: <Search className="h-4 w-4" />,
      run: () => firstStation && setStation(firstStation),
    },
    {
      id: 'support-high',
      group: 'Filters',
      label: 'Set min support to 70',
      hint: 'support',
      icon: <SlidersHorizontal className="h-4 w-4" />,
      run: () => setMinSupport(70),
    },
    {
      id: 'clear-filters',
      group: 'Filters',
      label: 'Clear filters',
      hint: 'reset',
      icon: <Eraser className="h-4 w-4" />,
      run: reset,
    },
    {
      id: 'reoptimize',
      group: 'Actions',
      label: 'Re-optimize deployment',
      hint: 'budget',
      icon: <Gauge className="h-4 w-4" />,
      run: openOptimizer,
    },
    {
      id: 'budget-custom',
      group: 'Officer Budget',
      label: 'Change officer budget',
      hint: 'type any number',
      icon: <Gauge className="h-4 w-4" />,
      run: openOptimizer,
    },
    {
      id: 'budget-500',
      group: 'Officer Budget',
      label: 'Set officer budget to 500',
      hint: '500 officers',
      icon: <Gauge className="h-4 w-4" />,
      run: () => {
        setBudget(500);
        openOptimizer();
      },
    },
    {
      id: 'budget-1000',
      group: 'Officer Budget',
      label: 'Set officer budget to 1000',
      hint: '1000 officers',
      icon: <Gauge className="h-4 w-4" />,
      run: () => {
        setBudget(1000);
        openOptimizer();
      },
    },
    {
      id: 'refresh',
      group: 'Actions',
      label: 'Refresh all data',
      hint: 'r',
      icon: <RefreshCw className="h-4 w-4" />,
      run: () => queryClient.invalidateQueries(),
    },
    {
      id: 'toggle-motion',
      group: 'View',
      label: 'Toggle reduced motion',
      hint: 'accessibility',
      icon: <Moon className="h-4 w-4" />,
      run: toggleMotion,
    },
    {
      id: 'toggle-density',
      group: 'View',
      label: 'Toggle density',
      hint: 'compact',
      icon: <Bot className="h-4 w-4" />,
      run: toggleDensity,
    },
  ];

  const groups = Array.from(new Set(commands.map((item) => item.group)));

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="ClearLane command palette"
      className="fixed left-1/2 top-24 z-[70] w-[min(640px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-xl border border-border-strong bg-bg-elevated shadow-glass-strong data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
      overlayClassName="fixed inset-0 z-[60] bg-bg-void/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    >
      <div className="border-b border-border-default px-4 py-3">
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Search commands..."
          className="w-full bg-transparent text-sm text-fg-primary outline-none placeholder:text-fg-tertiary"
        />
      </div>
      <Command.List className="max-h-[420px] overflow-y-auto p-2">
        <Command.Empty className="px-3 py-8 text-center text-sm text-fg-secondary">
          No command found.
        </Command.Empty>
        <motion.div variants={commandListVariants} initial="hidden" animate="open">
          {groups.map((group) => (
            <Command.Group
              key={group}
              heading={group}
              className="px-1 py-2 text-[10px] font-semibold uppercase tracking-wider text-fg-tertiary"
            >
              {commands
                .filter((item) => item.group === group)
                .map((item) => (
                  <motion.div key={item.id} variants={commandItemVariants}>
                    <Command.Item
                      value={`${item.group} ${item.label} ${item.hint}`}
                      onSelect={() => closeAfter(item)}
                      className="mt-1 flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-fg-secondary outline-none data-[selected=true]:bg-bg-canvas data-[selected=true]:text-fg-primary"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-fg-tertiary">{item.icon}</span>
                        <span>{item.label}</span>
                      </span>
                      <span className="font-mono text-[10px] text-fg-tertiary">{item.hint}</span>
                    </Command.Item>
                  </motion.div>
                ))}
            </Command.Group>
          ))}
        </motion.div>
      </Command.List>
    </Command.Dialog>
  );
}
