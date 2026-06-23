import React from 'react';
import { ArtifactDiagnosticsWall } from '../../components/artifacts/ArtifactDiagnosticsWall';

export function ArtifactsPage() {
  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      <ArtifactDiagnosticsWall />
    </div>
  );
}
