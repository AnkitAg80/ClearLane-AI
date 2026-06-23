import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { FilterX } from 'lucide-react';
import { useFilterStore } from '../../stores/useFilterStore';
import { useSelectionStore } from '../../stores/useSelectionStore';
import { useOverview } from '../../lib/api/hooks';
import { Button } from '../ui/Button';
import { LocationSearchBox } from './LocationSearchBox';

export function FilterBar() {
  const {
    station,
    minSupport,
    query,
    selectedH3,
    setStation,
    setMinSupport,
    hydrateFromUrl,
    reset,
  } = useFilterStore();
  const { select } = useSelectionStore();
  const { data } = useOverview();
  const [searchParams, setSearchParams] = useSearchParams();

  const stations = data?.filters?.stations || [];
  const suggestions = data?.filters?.suggestions || [];

  React.useEffect(() => {
    const nextStation = searchParams.get('station');
    const nextSupport = Number(searchParams.get('support') || '0');
    const nextQuery = searchParams.get('q') || '';
    const nextH3 = searchParams.get('h3');

    hydrateFromUrl({
      station: nextStation || null,
      minSupport: Number.isFinite(nextSupport) ? nextSupport : 0,
      query: nextQuery,
      h3: nextH3 || null,
    });
    if (nextH3) select(nextH3);
  }, [hydrateFromUrl, searchParams, select]);

  const handleStationChange = (val: string | null) => {
    setStation(val);
    const params = new URLSearchParams(searchParams);
    if (val) params.set('station', val); else params.delete('station');
    setSearchParams(params, { replace: true });
  };

  const handleSupportChange = (val: number) => {
    setMinSupport(val);
    const params = new URLSearchParams(searchParams);
    if (val > 0) params.set('support', String(val)); else params.delete('support');
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => {
    reset();
    select(null);
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  return (
    <div className="flex w-full items-center gap-3 overflow-x-auto scrollbar-none pr-2">
      <div className="min-w-[12rem] flex-1 border-r border-border-default pr-3">
        <LocationSearchBox suggestions={suggestions} />
      </div>

      <div className="flex items-center gap-2 border-r border-border-default pr-3">
        <span className="text-xs text-fg-secondary font-medium">Station:</span>
        <select 
          value={station || ''} 
          onChange={(e) => handleStationChange(e.target.value || null)}
          aria-label="Police station"
          className="bg-bg-canvas text-sm border border-border-strong rounded px-2 py-1 outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All Stations</option>
          {stations.map(st => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 border-r border-border-default pr-3">
        <span className="whitespace-nowrap text-xs font-medium text-fg-secondary">Min Support:</span>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={minSupport} 
          onChange={(e) => handleSupportChange(Number(e.target.value))}
          aria-label="Minimum support"
          className="w-24 accent-accent"
        />
        <span className="text-xs font-tabular text-fg-primary w-6 text-right">{minSupport}%</span>
      </div>

      <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear Filters" className="ml-auto shrink-0 text-fg-tertiary hover:text-fg-primary">
        <FilterX className="h-4 w-4" />
      </Button>
    </div>
  );
}
