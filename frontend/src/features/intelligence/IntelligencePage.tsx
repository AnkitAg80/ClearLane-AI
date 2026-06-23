import React from 'react';
import { SignalIntelligenceBoard } from '../../components/intelligence/SignalIntelligenceBoard';

export function IntelligencePage() {
  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <SignalIntelligenceBoard />
    </div>
  );
}
