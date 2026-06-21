import { Search, X } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';

export default function Toolbar({
  stations,
  searchSuggestions = [],
  station,
  setStation,
  query,
  setQuery,
  metricMode,
  setMetricMode,
  activeView,
}) {
  const [localQuery, setLocalQuery] = useState(query);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
    setQuery(localQuery);
    setShowDropdown(false);
  };

  const handleClear = () => {
    setLocalQuery('');
    setQuery('');
    setShowDropdown(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const filteredSuggestions = useMemo(() => {
    const needle = localQuery.trim().toLowerCase();
    if (!needle) return [];
    return searchSuggestions
      .filter((item) => {
        const searchable = [
          item.label,
          item.value,
          item.secondary,
          item.station,
          item.junction,
          item.h3,
        ].filter(Boolean).join(' ').toLowerCase();
        return searchable.includes(needle);
      })
      .sort((a, b) => {
        const aLabel = String(a.label || a.value || '').toLowerCase();
        const bLabel = String(b.label || b.value || '').toLowerCase();
        const aStarts = aLabel.startsWith(needle) ? 0 : 1;
        const bStarts = bLabel.startsWith(needle) ? 0 : 1;
        return aStarts - bStarts || aLabel.localeCompare(bLabel);
      });
  }, [localQuery, searchSuggestions]);

  const visibleSuggestions = filteredSuggestions.slice(0, 8);

  const metricOptions = [
    { value: 'deployment_score', label: 'Score', description: 'AI-driven urgency score combining current congestion, historical patterns, and severity to prioritize deployments.' },
    { value: 'pred_next_3h_cii', label: 'Forecast', description: 'The predicted Congestion Impact Index (CII) before deployment over the next 3 hours.' },
    { value: 'remaining_next_3h_cii', label: 'After deployment', description: 'Estimated remaining next-3-hour CII after subtracting expected officer relief.' },
    { value: 'officers_assigned', label: 'Officers', description: 'The recommended number of police officers to be deployed to this specific area.' },
    { value: 'expected_relief', label: 'Relief', description: 'Estimated CII reduction units achieved by assigning officers here.' },
  ];

  return (
    <div className="toolbar" aria-label="Command filters">
      <label className="field field--search" style={{ position: 'relative' }} ref={wrapperRef}>
        <span className="sr-only">Search hotspots</span>
        <input
          value={localQuery}
          onChange={(event) => {
            setLocalQuery(event.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search location, station, cell"
          autoComplete="off"
        />
        {localQuery && (
          <button
            type="button"
            onClick={handleClear}
            style={{ background: 'transparent', border: 'none', color: 'var(--muted)', padding: 0, display: 'flex', alignItems: 'center', marginRight: '8px' }}
            aria-label="Clear search"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={handleSearch}
          className="search-submit"
          aria-label="Submit search"
        >
          <Search size={16} aria-hidden="true" />
          <span>Search</span>
        </button>

        {showDropdown && localQuery && visibleSuggestions.length > 0 && (
          <ul className="search-suggestions" aria-label="Location search suggestions">
            <li className="suggestions-header">
              {filteredSuggestions.length === visibleSuggestions.length
                ? `${filteredSuggestions.length} matching ${filteredSuggestions.length === 1 ? 'location' : 'locations'}`
                : `Showing ${visibleSuggestions.length} of ${filteredSuggestions.length} matching locations`}
            </li>
            {visibleSuggestions.map((item) => (
              <li key={`${item.type}-${item.value}-${item.h3 || item.secondary || ''}`}>
                <button
                  type="button"
                  className="suggestion-option"
                  onClick={() => {
                    setLocalQuery(item.value);
                    setQuery(item.value);
                    setShowDropdown(false);
                  }}
                >
                  <span className="suggestion-label">{item.label || item.value}</span>
                  {item.secondary && <span className="suggestion-meta">{item.secondary}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </label>



      {activeView === 'command' && (
        <div className="segmented" role="group" aria-label="Map metric">
          {metricOptions.map((item) => (
            <button
              key={item.value}
              type="button"
              className={metricMode === item.value ? 'is-active' : ''}
              onClick={() => setMetricMode(item.value)}
              title={item.description}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
