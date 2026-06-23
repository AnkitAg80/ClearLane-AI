import React from 'react';
import { useSelectionStore } from '../../stores/useSelectionStore';
import { HotspotDetailSheet } from '../hotspots/HotspotDetailSheet';
import { CommandPalette } from '../command/CommandPalette';
import { AssistantDock } from '../assistant/AssistantDock';
import { OfficerBudgetModal } from '../deployment/OfficerBudgetModal';
import { CommandHelpFAQ } from '../foundation/CommandHelpFAQ';
import { CommandDeckShell } from './CommandDeckShell';

export function AppShell() {
  const { selectedH3, select } = useSelectionStore();

  return (
    <CommandDeckShell>
      <div aria-live="polite" className="sr-only">ClearLane workspace ready</div>
      <CommandPalette />
      <CommandHelpFAQ />
      <AssistantDock />
      <OfficerBudgetModal />
      <HotspotDetailSheet h3={selectedH3} onClose={() => select(null)} />
    </CommandDeckShell>
  );
}
