import { Filter, Search, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function Toolbar({
  stations,
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

  const filteredStations = stations.filter(st =>
    st.toLowerCase().includes(localQuery.toLowerCase())
  );

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

        {showDropdown && localQuery && filteredStations.length > 0 && (
          <ul style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            listStyle: 'none',
            margin: 0,
            padding: '4px 0',
            maxHeight: '240px',
            overflowY: 'auto',
            zIndex: 50,
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}>
            {filteredStations.map((item) => (
              <li
                key={item}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: 'var(--text)',
                  transition: 'background-color 0.15s ease'
                }}
                onClick={() => {
                  setLocalQuery(item);
                  setQuery(item);
                  setShowDropdown(false);
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(34, 197, 94, 0.1)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                {item}
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
