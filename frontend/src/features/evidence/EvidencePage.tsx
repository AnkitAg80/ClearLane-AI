import { DataQualitySecurityPanel } from '../../components/data/DataQualitySecurityPanel';
import { StickyEvidenceNarrative } from '../../components/evidence/StickyEvidenceNarrative';

export function EvidencePage() {
  return (
    <div className="relative h-full overflow-y-auto p-4 md:p-6">
      <div className="mx-auto grid max-w-[1600px] gap-5 xl:grid-cols-[1fr_320px]">
        <StickyEvidenceNarrative />
        <DataQualitySecurityPanel />
      </div>
    </div>
  );
}
