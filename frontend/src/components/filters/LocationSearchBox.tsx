import React from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
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

function buildCanvasHref(query: string, h3: string | null | undefined, currentParams: URLSearchParams) {
  const params = new URLSearchParams(currentParams);
  if (h3) params.set('h3', h3); else params.delete('h3');
  if (query.trim()) params.set('q', query.trim()); else params.delete('q');
  return `/canvas${params.toString() ? `?${params.toString()}` : ''}`;
}

export function LocationSearchBox({ suggestions }: LocationSearchBoxProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
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
      navigate(buildCanvasHref(suggestion.value, suggestion.h3, searchParams));
    } else {
      navigate(buildCanvasHref(suggestion.value, null, searchParams));
    }
    setOpen(false);
  }, [navigate, searchParams, select, setSelectedSuggestion]);

  const handleSubmit = React.useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSelectedH3(null);
    select(null);
    const href = buildCanvasHref(query, null, searchParams);
    if (location.pathname !== '/canvas' || location.search !== href.replace('/canvas', '')) {
      navigate(href);
    }
    setOpen(false);
  }, [location.pathname, location.search, navigate, query, searchParams, select, setSelectedH3]);

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
    <div ref={rootRef} className="relative z-[70] w-full min-w-0">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-tertiary" />
          <input
            type="search"
            placeholder="Search locations..."
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
            className="h-9 w-full rounded-md border border-border-default bg-bg-canvas pl-9 pr-10 text-sm text-fg-primary shadow-inner outline-none transition-colors placeholder:text-fg-tertiary focus:border-accent focus:ring-1 focus:ring-accent"
          />
          {query ? (
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
          title="Search all matches"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-accent/70 bg-accent px-3 text-xs font-semibold text-white shadow-glass transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          <span>Search</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </form>

      {open && (query || matchingSuggestions.length > 0) ? (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-[80] w-[28rem] max-w-[100vw] overflow-hidden rounded-lg border border-border-default bg-bg-elevated text-fg-primary shadow-glass-strong">
          <div className="max-h-[22rem] overflow-y-auto p-1.5">
            {matchingSuggestions.length > 0 ? matchingSuggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.value}-${suggestion.h3 || index}`}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => chooseSuggestion(suggestion)}
                className={cn(
                  'grid w-full grid-cols-[1rem_1fr] gap-2 rounded-md px-2.5 py-2 text-left transition-colors',
                  index === safeActiveIndex ? 'bg-accent/20 text-accent' : 'text-fg-secondary hover:bg-bg-elevated hover:text-fg-primary',
                )}
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 text-accent" />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold">{suggestion.label}</span>
                  <span className="mt-0.5 block truncate text-[10px] text-fg-tertiary">
                    {suggestion.secondary || suggestion.h3 || 'Dataset location'}
                  </span>
                </span>
              </button>
            )) : (
              <div className="px-3 py-4 text-center text-xs text-fg-tertiary">
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
              navigate(buildCanvasHref(query, null, searchParams));
              setOpen(false);
            }}
            className="flex w-full items-center justify-between border-t border-border-default px-3 py-2 text-xs text-fg-secondary transition-colors hover:bg-bg-elevated hover:text-fg-primary"
          >
            <span className="inline-flex items-center gap-2">
              <LocateFixed className="h-3.5 w-3.5 text-accent" />
              Search all matches
            </span>
            <span className="font-mono text-[10px] text-fg-tertiary">
              {normalizedQuery ? `${matchingSuggestions.length}+` : suggestions.length} locations
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
