import { ArrowDownWideNarrow, Crosshair } from 'lucide-react';

export default function HotspotTable({ rows, selectedH3, onSelect }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th><ArrowDownWideNarrow size={14} aria-hidden="true" /> Rank</th>
            <th>Hotspot</th>
            <th>Station</th>
            <th>Score</th>
            <th>Next 3h</th>
            <th>Officers</th>
            <th>Relief</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.h3}
              className={selectedH3 === row.h3 ? 'is-selected' : ''}
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
              <td>{row.officers_assigned || 0}</td>
              <td>{Number(row.expected_relief || 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <div className="empty-state">No hotspots match the current filters.</div>}
    </div>
  );
}
