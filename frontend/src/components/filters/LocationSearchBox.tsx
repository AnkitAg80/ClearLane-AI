import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, MapPin, LocateFixed, X } from 'lucide-react';
import type { SearchSuggestion } from '../../types/api';
import { useFilterStore } from '../../stores/useFilterStore';
import { useSelectionStore } from '../../stores/useSelectionStore';
import { cn } from '../../lib/utils/cn';

interface LocationSearchBoxProps {
  suggestions: SearchSuggestion[];
}

const MAX_VISIBLE_SUGGESTIONS = 8;

function includesQuery(value: string | null | undefined, query: string) {
  return value?.toLowerCase().includes(query) ?? false;
}

function buildCanvasHref(query: string, h3?: string | null) {
  const params = new URLSearchParams();
  if (h3) params.set('h3', h3);
  if (query.trim()) params.set('q', query.trim());
  return `/canvas${params.toString() ? `?${params.toString()}` : ''}`;
}

export function LocationSearchBox({ suggestions }: LocationSearchBoxProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { query, setQuery, setSelectedH3, setSelectedSuggestion } = useFilterStore();
  const { select } = useSelectionStore();
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const matchingSuggestions = React.useMemo(() => {
    if (!normalizedQuery) return suggestions.slice(0, MAX_VISIBLE_SUGGESTIONS);
    return suggestions
      .filter((suggestion) => (
        includesQuery(suggestion.value, normalizedQuery)
        || includesQuery(suggestion.station, normalizedQuery)
        || includesQuery(suggestion.junction, normalizedQuery)
        || includesQuery(suggestion.h3, normalizedQuery)
      ))
      .slice(0, MAX_VISIBLE_SUGGESTIONS);
  }, [normalizedQuery, suggestions]);
  const safeActiveIndex = matchingSuggestions.length > 0
    ? Math.min(activeIndex, matchingSuggestions.length - 1)
    : 0;

  React.useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const chooseSuggestion = React.useCallback((suggestion: SearchSuggestion) => {
    setSelectedSuggestion(suggestion);
    if (suggestion.h3) {
      select(suggestion.h3);
      navigate(`/canvas?h3=${encodeURIComponent(suggestion.h3)}&q=${encodeURIComponent(suggestion.value)}`);
    } else {
      navigate(buildCanvasHref(suggestion.value));
    }
    setOpen(false);
  }, [navigate, select, setSelectedSuggestion]);

  const handleSubmit = React.useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSelectedH3(null);
    select(null);
    const href = buildCanvasHref(query);
    if (location.pathname !== '/canvas' || location.search !== href.replace('/canvas', '')) {
      navigate(buildCanvasHref(query));
    }
    setOpen(false);
  }, [location.pathname, location.search, navigate, query, select, setSelectedH3]);

  const handleKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(matchingSuggestions.length - 1, 0)));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === 'Enter' && open && matchingSuggestions[safeActiveIndex]) {
      event.preventDefault();
      chooseSuggestion(matchingSuggestions[safeActiveIndex]);
    }
    if (event.key === 'Escape') {
      setOpen(false);
    }
  }, [chooseSuggestion, matchingSuggestions, open, safeActiveIndex]);

  const clearSearch = React.useCallback(() => {
    setQuery('');
    select(null);
    setOpen(false);
  }, [select, setQuery]);

  return (
    <div ref={rootRef} className="relative z-[70] min-w-[22rem] flex-1">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
          <input
            type="search"
            placeholder="Search dataset locations..."
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
              setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            aria-label="Search locations"
            aria-autocomplete="list"
            aria-expanded={open}
            className="h-9 w-full rounded-md border border-white/18 bg-[#05070b] pl-9 pr-10 text-sm text-white shadow-inner outline-none transition-colors placeholder:text-slate-400 focus:border-sig-cold focus:ring-1 focus:ring-sig-cold"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
        <button
          type="submit"
          title="Search all matches"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-sig-cold/70 bg-sig-cold px-3 text-xs font-semibold text-[#03131d] shadow-glass transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sig-cold"
        >
          <span>Search</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </form>

      {open && (query || matchingSuggestions.length > 0) ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[80] min-w-[28rem] overflow-hidden rounded-lg border border-white/18 bg-[#05070b]/98 text-white shadow-glass backdrop-blur-2xl">
          <div className="max-h-[22rem] overflow-y-auto p-1.5">
            {matchingSuggestions.length > 0 ? matchingSuggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.value}-${suggestion.h3 || index}`}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => chooseSuggestion(suggestion)}
                className={cn(
                  'grid w-full grid-cols-[1rem_1fr] gap-2 rounded-md px-2.5 py-2 text-left transition-colors',
                  index === safeActiveIndex ? 'bg-sig-cold/18 text-white' : 'text-slate-200 hover:bg-white/[0.08] hover:text-white',
                )}
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 text-sig-cold" />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold">{suggestion.label}</span>
                  <span className="mt-0.5 block truncate text-[10px] text-slate-400">
                    {suggestion.secondary || suggestion.h3 || 'Dataset location'}
                  </span>
                </span>
              </button>
            )) : (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                No dataset locations match this search.
              </div>
            )}
          </div>

          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setSelectedH3(null);
              select(null);
              navigate(buildCanvasHref(query));
              setOpen(false);
            }}
            className="flex w-full items-center justify-between border-t border-white/10 px-3 py-2 text-xs text-slate-200 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <span className="inline-flex items-center gap-2">
              <LocateFixed className="h-3.5 w-3.5 text-sig-calm" />
              Search all matches
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              {normalizedQuery ? `${matchingSuggestions.length}+` : suggestions.length} locations
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
