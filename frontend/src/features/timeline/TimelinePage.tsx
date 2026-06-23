import React from 'react';
import { ForecastHorizonStage } from '../../components/timeline/ForecastHorizonStage';

export function TimelinePage() {
  return (
    <div className="h-full overflow-hidden p-4 md:p-6">
      <ForecastHorizonStage />
    </div>
  );
}
