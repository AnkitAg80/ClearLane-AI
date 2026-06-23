import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrefsStore } from '../../stores/usePrefsStore';

interface PendingMutationOverlayProps {
  isPending: boolean;
  label?: string;
}

export function PendingMutationOverlay({ isPending, label = 'Optimizing deployment...' }: PendingMutationOverlayProps) {
  const reducedMotion = usePrefsStore((state) => state.reducedMotion);

  return (
    <AnimatePresence>
      {isPending && (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.3 }}
          className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-bg-void/40 backdrop-blur-sm" />
          <motion.div
            initial={reducedMotion ? false : { scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            className="relative z-10 rounded-xl border border-accent/30 bg-bg-elevated px-8 py-6 shadow-glass-strong"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="relative h-8 w-48 overflow-hidden rounded-full bg-bg-canvas">
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-accent/20 via-accent/60 to-accent/20"
                  animate={reducedMotion ? { x: '0%' } : { x: ['-100%', '200%'] }}
                  transition={reducedMotion ? { duration: 0 } : { duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
              </div>
              <div className="text-sm font-medium text-fg-primary">{label}</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
