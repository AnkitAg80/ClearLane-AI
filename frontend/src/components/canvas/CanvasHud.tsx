import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, SlidersHorizontal, Eye, EyeOff, MapPin } from 'lucide-react';
import { Glass } from '../ui/Glass';
import { IconButton } from '../ui/IconButton';
import { useCanvasStore } from '../../stores/useCanvasStore';
import { useSelectionStore } from '../../stores/useSelectionStore';
import { usePrefsStore } from '../../stores/usePrefsStore';

export function CanvasHud() {
  const { layers, toggleLayer, hudVisible, setHudVisible } = useCanvasStore();
  const { selectedH3 } = useSelectionStore();
  const reducedMotion = usePrefsStore((s) => s.reducedMotion);
  const hudTimer = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    if (reducedMotion) return;

    const onMove = () => {
      setHudVisible(true);
      clearTimeout(hudTimer.current);
      hudTimer.current = setTimeout(() => {
        setHudVisible(false);
      }, 3000);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchstart', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchstart', onMove);
      clearTimeout(hudTimer.current);
    };
  }, [reducedMotion, setHudVisible]);

  const toggleExtrude = React.useCallback(() => toggleLayer('extrude'), [toggleLayer]);
  const togglePredicted = React.useCallback(() => toggleLayer('predicted'), [toggleLayer]);
  const toggleFill = React.useCallback(() => toggleLayer('fill'), [toggleLayer]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: hudVisible ? 1 : 0, x: hudVisible ? 0 : -8 }}
        exit={{ opacity: 0, x: -8 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-4 left-4 z-10 flex flex-col gap-2"
      >
        <Glass className="p-1 rounded-lg flex flex-col gap-1">
          <IconButton
            icon={layers.extrude ? <Layers className="w-4 h-4" /> : <Layers className="w-4 h-4 text-fg-tertiary" />}
            variant={layers.extrude ? 'primary' : 'ghost'}
            aria-label="Toggle extruded hotspot layer"
            onClick={toggleExtrude}
          />
          <IconButton
            icon={layers.predicted ? <SlidersHorizontal className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4 text-fg-tertiary" />}
            variant={layers.predicted ? 'primary' : 'ghost'}
            aria-label="Toggle predicted layer"
            onClick={togglePredicted}
          />
          <IconButton
            icon={layers.fill ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            variant={layers.fill ? 'primary' : 'ghost'}
            aria-label="Toggle base fill layer"
            onClick={toggleFill}
          />
        </Glass>
        <Glass className="p-1 rounded-lg flex flex-col gap-1">
          <IconButton
            icon={<MapPin className="w-4 h-4" />}
            variant={selectedH3 ? 'primary' : 'ghost'}
            aria-label={selectedH3 ? 'Selected hotspot' : 'No hotspot selected'}
            disabled={!selectedH3}
          />
        </Glass>
      </motion.div>
    </AnimatePresence>
  );
}
