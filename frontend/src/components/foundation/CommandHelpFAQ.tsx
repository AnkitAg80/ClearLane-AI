import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command as CommandIcon, Keyboard } from 'lucide-react';
import { Glass } from '../ui/Glass';

const SHORTCUTS = [
  { keys: ['Cmd', 'K'], label: 'Toggle command palette' },
  { keys: ['Cmd', 'L'], label: 'Toggle assistant' },
  { keys: ['Esc'], label: 'Close panels / dismiss' },
  { keys: ['?'], label: 'Toggle this help' },
];

export function CommandHelpFAQ() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.target) {
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-10 left-4 z-40 flex h-8 w-8 items-center justify-center rounded-full border border-border-default bg-bg-elevated/80 text-fg-tertiary hover:text-fg-primary transition-colors"
        aria-label="Toggle keyboard shortcuts help"
        title="Keyboard shortcuts (?)"
      >
        <Keyboard className="h-3.5 w-3.5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-20 left-4 z-40 w-72"
          >
            <Glass className="rounded-xl border border-border-strong p-4">
              <div className="flex items-center gap-2 mb-3">
                <CommandIcon className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold">Keyboard Shortcuts</span>
              </div>
              <div className="space-y-2">
                {SHORTCUTS.map((shortcut) => (
                  <div key={shortcut.label} className="flex items-center justify-between text-xs">
                    <span className="text-fg-secondary">{shortcut.label}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key) => (
                        <kbd
                          key={key}
                          className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-border-default bg-bg-canvas px-1.5 font-mono text-[10px] text-fg-tertiary"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Glass>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
