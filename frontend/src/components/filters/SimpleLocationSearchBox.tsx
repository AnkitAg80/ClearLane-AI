import React, { useState } from 'react';
import { Search, ArrowRight, X } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useFilterStore } from '../../stores/useFilterStore';
import { useSelectionStore } from '../../stores/useSelectionStore';

export function SimpleLocationSearchBox() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { query: storeQuery, setQuery, setSelectedH3 } = useFilterStore();
  const { select } = useSelectionStore();
  
  // Use purely local state for typing to prevent any external interference
  const [localQuery, setLocalQuery] = useState(storeQuery || '');

  // Keep local query in sync with store query if it changes externally
  React.useEffect(() => {
    setLocalQuery(storeQuery || '');
  }, [storeQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update global stores to trigger map filtering
    setQuery(localQuery);
    setSelectedH3(null);
    select(null);
    
    // Update URL
    const params = new URLSearchParams(searchParams);
    params.delete('h3');
    if (localQuery.trim()) {
      params.set('q', localQuery.trim());
    } else {
      params.delete('q');
    }
    
    const href = `/canvas${params.toString() ? `?${params.toString()}` : ''}`;
    if (location.pathname !== '/canvas' || location.search !== href.replace('/canvas', '')) {
      navigate(href);
    }
  };

  const clearSearch = () => {
    setLocalQuery('');
    setQuery('');
    setSelectedH3(null);
    select(null);
    
    const params = new URLSearchParams(searchParams);
    params.delete('h3');
    params.delete('q');
    const href = `/canvas${params.toString() ? `?${params.toString()}` : ''}`;
    if (location.pathname !== '/canvas' || location.search !== href.replace('/canvas', '')) {
      navigate(href);
    }
  };

  return (
    <div className="w-full min-w-0">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-tertiary" />
          <input
            type="text"
            placeholder="Search dataset locations..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            className="h-9 w-full rounded-md border border-border-default bg-bg-canvas pl-9 pr-10 text-sm text-fg-primary shadow-inner outline-none transition-colors placeholder:text-fg-tertiary focus:border-accent focus:ring-1 focus:ring-accent"
          />
          {localQuery ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-fg-tertiary transition-colors hover:bg-bg-elevated hover:text-fg-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
        <button
          type="submit"
          title="Search"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-accent/70 bg-accent px-3 text-xs font-semibold text-white shadow-glass transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          <span>Search</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
