import React from 'react';
import { HotspotTriageStage } from '../../components/hotspots/HotspotTriageStage';

export function HotspotsPage() {
  return (
    <div className="h-full overflow-hidden p-4 md:p-6">
      <HotspotTriageStage />
    </div>
  );
}
