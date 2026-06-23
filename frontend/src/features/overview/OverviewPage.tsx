import { CinematicOverviewHero } from '../../components/overview/CinematicOverviewHero';
import { CapabilityBentoField } from '../../components/overview/CapabilityBentoField';
import { MissionPressureRail } from '../../components/overview/MissionPressureRail';
import { StickyEvidencePreview } from '../../components/overview/StickyEvidencePreview';

export function OverviewPage() {
  return (
    <div className="relative z-10 h-full overflow-y-auto overflow-x-hidden">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 p-4 md:p-6">
        <CinematicOverviewHero />
        <CapabilityBentoField />
        <MissionPressureRail />
        <StickyEvidencePreview />
      </div>
    </div>
  );
}
