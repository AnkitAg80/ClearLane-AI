import { Filter, Search, SlidersHorizontal } from 'lucide-react';

export default function Toolbar({
  stations,
  station,
  setStation,
  minSupport,
  setMinSupport,
  query,
  setQuery,
  metricMode,
  setMetricMode,
}) {
  const metricOptions = [
    { value: 'deployment_score', label: 'Score' },
    { value: 'pred_next_3h_cii', label: 'Next 3h' },
    { value: 'officers_assigned', label: 'Officers' },
    { value: 'expected_relief', label: 'Relief' },
    { value: 'support_score', label: 'Support' },
  ];

  return (
    <div className="toolbar" aria-label="Command filters">
      <label className="field field--search">
        <Search size={16} aria-hidden="true" />
        <span className="sr-only">Search hotspots</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search location, station, cell"
        />
      </label>

      <label className="field">
        <Filter size={16} aria-hidden="true" />
        <span className="sr-only">Police station</span>
        <select value={station} onChange={(event) => setStation(event.target.value)}>
          <option value="ALL">All stations</option>
          {stations.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <label className="range-field">
        <span>
          <SlidersHorizontal size={16} aria-hidden="true" />
          Support {Number(minSupport).toFixed(2)}
        </span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={minSupport}
          onChange={(event) => setMinSupport(Number(event.target.value))}
        />
      </label>

      <div className="segmented" role="group" aria-label="Map metric">
        {metricOptions.map((item) => (
          <button
            key={item.value}
            type="button"
            className={metricMode === item.value ? 'is-active' : ''}
            onClick={() => setMetricMode(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
