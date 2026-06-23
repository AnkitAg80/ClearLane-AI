import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent } from '../ui/Sheet';
import { useHotspotDetail } from '../../lib/api/hooks';
import { Stat } from '../ui/Stat';
import { Badge } from '../ui/Badge';
import { Map } from 'lucide-react';
import { Button } from '../ui/Button';

interface HotspotDetailSheetProps {
  h3: string | null;
  onClose: () => void;
}

export function HotspotDetailSheet({ h3, onClose }: HotspotDetailSheetProps) {
  const { data, isLoading } = useHotspotDetail(h3);
  const navigate = useNavigate();

  return (
    <Sheet open={!!h3} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[450px] sm:max-w-[450px] p-0 flex flex-col bg-bg-canvas">
        {isLoading ? (
          <div className="p-6 space-y-4 animate-pulse">
            <div className="h-8 w-2/3 bg-bg-elevated/50 rounded" />
            <div className="h-4 w-1/2 bg-bg-elevated/50 rounded" />
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="h-20 bg-bg-elevated/50 rounded" />
              <div className="h-20 bg-bg-elevated/50 rounded" />
            </div>
          </div>
        ) : data ? (
          <>
            <div className="p-6 border-b border-border-default bg-bg-elevated/30 flex-shrink-0">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{data.station || 'Unknown'}</Badge>
                    <span className="text-xs font-mono text-fg-tertiary">{data.h3}</span>
                  </div>
                  <h2 className="text-xl font-bold text-fg-primary tracking-tight">{data.title}</h2>
                </div>
              </div>
              <div className="text-sm text-fg-secondary">
                {data.location} {data.junction && `- ${data.junction}`}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-secondary mb-4">Scorecards</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(data.scorecards || {}).map(([key, value]) => (
                    <Stat 
                      key={key} 
                      label={key.replace(/_/g, ' ')} 
                      value={value !== null ? value.toFixed(3) : '-'} 
                      className="bg-bg-elevated/50"
                    />
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-secondary mb-4">Signals</h3>
                <div className="space-y-3">
                  {(data.signals || []).map((signal, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-bg-elevated border border-border-default">
                      <span className="text-sm font-medium">{signal.name}</span>
                      <span className="text-sm font-tabular">{signal.value !== null ? signal.value.toFixed(1) : '-'}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-secondary mb-4">Raw Data</h3>
                <pre className="p-4 rounded-lg bg-bg-void border border-border-strong text-[10px] font-mono text-fg-tertiary overflow-x-auto">
                  {JSON.stringify(data.raw, null, 2)}
                </pre>
              </section>
            </div>

            <div className="p-4 border-t border-border-default bg-bg-elevated/50 flex-shrink-0">
              <Button className="w-full gap-2" onClick={() => h3 && navigate(`/canvas?h3=${encodeURIComponent(h3)}`)}>
                <Map className="w-4 h-4" />
                View on Canvas
              </Button>
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-fg-secondary">Failed to load hotspot details.</div>
        )}
      </SheetContent>
    </Sheet>
  );
}
