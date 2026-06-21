import { useState, useMemo } from 'react';
import { ArrowDownWideNarrow, Crosshair, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export default function HotspotTable({ rows, selectedH3, onSelect }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });

  const sortedRows = useMemo(() => {
    let sortableItems = [...rows];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key] ?? 0;
        const bVal = b[sortConfig.key] ?? 0;
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [rows, sortConfig]);

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={12} style={{ opacity: 0.3, marginLeft: '4px', verticalAlign: 'middle' }} />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={12} style={{ marginLeft: '4px', verticalAlign: 'middle', color: '#f8fafc' }} /> 
      : <ArrowDown size={12} style={{ marginLeft: '4px', verticalAlign: 'middle', color: '#f8fafc' }} />;
  };

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th><ArrowDownWideNarrow size={14} aria-hidden="true" /> Rank</th>
            <th>Hotspot</th>
            <th>Station</th>
            <th onClick={() => requestSort('deployment_score')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }} title="Overall importance weighting calculated by the AI balancing severity, volume, and traffic impact.">
              Priority Score {getSortIcon('deployment_score')}
            </th>
            <th onClick={() => requestSort('pred_next_3h_cii')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }} title="Congestion Impact Index forecasted for the upcoming 3 hours.">
              Predicted Impact (CII) {getSortIcon('pred_next_3h_cii')}
            </th>
            <th onClick={() => requestSort('officers_assigned')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }} title="Number of officers specifically deployed to this zone.">
              Assigned Personnel {getSortIcon('officers_assigned')}
            </th>
            <th onClick={() => requestSort('expected_relief')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }} title="Predicted reduction in traffic congestion achieved by executing this deployment plan.">
              Est. Traffic Relief {getSortIcon('expected_relief')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, index) => (
            <tr
              key={row.h3}
              className={`${selectedH3 === row.h3 ? 'is-selected' : ''}`}
              style={row.officers_assigned > 0 ? { backgroundColor: 'rgba(34, 197, 94, 0.04)', borderLeft: '2px solid #22c55e' } : { borderLeft: '2px solid transparent' }}
              onClick={() => onSelect(row.h3)}
            >
              <td className="rank-cell"><Crosshair size={14} aria-hidden="true" /> {index + 1}</td>
              <td>
                <strong>{row.label || row.top_location || row.h3}</strong>
                <small>{row.top_junction || row.h3}</small>
              </td>
              <td>{row.top_police_station || 'N/A'}</td>
              <td>{Number(row.deployment_score || 0).toFixed(3)}</td>
              <td>{Number(row.pred_next_3h_cii || 0).toFixed(2)}</td>
              <td>
                {row.officers_assigned > 0 ? (
                  <span style={{ color: '#22c55e', fontWeight: 600 }}>{row.officers_assigned}</span>
                ) : (
                  row.officers_assigned || 0
                )}
              </td>
              <td>
                {row.expected_relief > 0 ? (
                  <span style={{ color: '#3b82f6', fontWeight: 500 }}>+{Number(row.expected_relief).toFixed(2)}</span>
                ) : (
                  Number(row.expected_relief || 0).toFixed(2)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sortedRows.length === 0 && <div className="empty-state">No hotspots match the current filters.</div>}
    </div>
  );
}
