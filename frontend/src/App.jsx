import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  BrainCircuit,
  Crosshair,
  Database,
  Map,
  RefreshCw,
  Route,
  ShieldAlert,
  Table2,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  getDeployment,
  getEvidence,
  getHotspotDetail,
  getHotspots,
  getMapRows,
  getOverview,
} from './api';
import CommandMap from './components/CommandMap';
import DeploymentView from './components/DeploymentView';
import EvidenceView from './components/EvidenceView';
import HotspotDetail from './components/HotspotDetail';
import HotspotTable from './components/HotspotTable';
import MetricCard from './components/MetricCard';
import Panel from './components/Panel';
import Toolbar from './components/Toolbar';

const views = [
  { id: 'command', label: 'Command', icon: Map },
  { id: 'hotspots', label: 'Hotspots', icon: Table2 },
  { id: 'explain', label: 'Explain', icon: Target },
  { id: 'deployment', label: 'Deploy', icon: Route },
  { id: 'evidence', label: 'Evidence', icon: BrainCircuit },
];

function formatNumber(value, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'N/A';
  return number.toFixed(digits);
}

function LoadingScreen() {
  return (
    <div className="boot-screen">
      <RefreshCw size={26} aria-hidden="true" />
      <strong>Loading Gridlock Command Center</strong>
      <span>Synchronizing forecast, deployment, and evidence streams.</span>
    </div>
  );
}

function ErrorScreen({ error, onRetry }) {
  return (
    <div className="boot-screen boot-screen--error">
      <ShieldAlert size={28} aria-hidden="true" />
      <strong>Command data unavailable</strong>
      <span>{error}</span>
      <button type="button" className="primary-button" onClick={onRetry}>
        <RefreshCw size={16} aria-hidden="true" />
        Retry
      </button>
    </div>
  );
}

export default function App() {
  const [overview, setOverview] = useState(null);
  const [mapRows, setMapRows] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [deployment, setDeployment] = useState(null);
  const [evidence, setEvidence] = useState(null);
  const [detail, setDetail] = useState(null);
  const [activeView, setActiveView] = useState('command');
  const [selectedH3, setSelectedH3] = useState(null);
  const [station, setStation] = useState('ALL');
  const [query, setQuery] = useState('');
  const [metricMode, setMetricMode] = useState('deployment_score');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const filters = useMemo(() => ({
    station,
    query,
    limit: 300,
  }), [station, query]);

  const loadStaticData = useCallback(async () => {
    setError('');
    setRefreshing(true);
    try {
      const [overviewPayload, deploymentPayload, evidencePayload] = await Promise.all([
        getOverview(),
        getDeployment(),
        getEvidence(),
      ]);
      setOverview(overviewPayload);
      setDeployment(deploymentPayload);
      setEvidence(evidencePayload);
    } catch (err) {
      setError(err.message || 'Unable to load dashboard payloads.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(loadStaticData);
  }, [loadStaticData]);

  useEffect(() => {
    let cancelled = false;
    async function loadFilteredData() {
      try {
        const [mapPayload, hotspotPayload] = await Promise.all([
          getMapRows(filters),
          getHotspots(filters),
        ]);
        if (cancelled) return;
        setMapRows(mapPayload.rows || []);
        const nextHotspots = hotspotPayload.rows || [];
        setHotspots(nextHotspots);
        if (!selectedH3 && nextHotspots[0]?.h3) {
          setSelectedH3(nextHotspots[0].h3);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unable to load filtered command data.');
      }
    }
    loadFilteredData();
    return () => {
      cancelled = true;
    };
  }, [filters, selectedH3]);

  useEffect(() => {
    if (!selectedH3) {
      return;
    }
    let cancelled = false;
    getHotspotDetail(selectedH3)
      .then((payload) => {
        if (!cancelled) setDetail(payload);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedH3]);

  const stations = overview?.filters?.stations || [];
  const summary = overview?.summary || {};
  const highlights = overview?.highlights || {};

  if (loading) return <LoadingScreen />;
  if (error && !overview) return <ErrorScreen error={error} onRetry={loadStaticData} />;

  return (
    <div className="app-shell">
      <aside className="nav-rail" aria-label="Primary navigation">
        <div className="brand-mark">
          <ShieldAlert size={24} aria-hidden="true" />
          <div>
            <strong>Gridlock</strong>
            <span>Command Center</span>
          </div>
        </div>

        <nav className="view-nav">
          {views.map((view) => {
            const Icon = view.icon;
            return (
              <button
                type="button"
                key={view.id}
                className={activeView === view.id ? 'is-active' : ''}
                onClick={() => setActiveView(view.id)}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{view.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="rail-status">
          <span className={refreshing ? 'pulse-dot is-loading' : 'pulse-dot'} />
          <div>
            <strong>{refreshing ? 'Refreshing' : 'Online'}</strong>
            <span>{overview?.artifacts?.filter((item) => item.exists).length || 0} artifacts ready</span>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="workspace-header">
          <div>
            <span className="kicker">Next-3-hour forecast and officer allocation</span>
            <h1>Operational deployment cockpit</h1>
          </div>
          <button type="button" className="primary-button" onClick={loadStaticData}>
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </button>
        </header>

        <Toolbar
          stations={stations}
          station={station}
          setStation={setStation}
          query={query}
          setQuery={setQuery}
          metricMode={metricMode}
          setMetricMode={setMetricMode}
        />

        <section className="metrics-grid metrics-grid--compact" aria-label="Command summary">
          <MetricCard icon={Crosshair} label="Assigned Personnel" value={summary.officers_deployed ?? 0} tone="success" tooltip="Total available police personnel strategically allocated across all active zones." />
          <MetricCard icon={Activity} label="Critical Zones" value={summary.active_cells ?? 0} tone="info" tooltip="Total number of high-priority targeted areas requiring immediate intervention." />
          <MetricCard icon={TrendingUp} label="Est. Traffic Relief" value={formatNumber(summary.expected_relief)} tone="success" tooltip="Predicted reduction in traffic congestion achieved by executing this deployment plan." />
          <MetricCard icon={ShieldAlert} label="AI Optimization Lift" value={`${formatNumber(highlights.lift_pct, 1)}%`} tone="warning" tooltip="Percentage improvement in congestion relief compared to a reactive, purely historical deployment." />
        </section>

        {error && <div className="inline-alert">{error}</div>}

        <AnimatePresence mode="wait">
          <motion.section
            key={activeView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="view-surface"
          >
            {activeView === 'command' && (
              <div className="command-layout">
                <Panel title="Command Map" eyebrow={`${mapRows.length} cells`}>
                  <CommandMap
                    rows={mapRows}
                    bbox={overview?.bbox}
                    selectedH3={selectedH3}
                    onSelect={setSelectedH3}
                    metricMode={metricMode}
                  />
                </Panel>
                <HotspotDetail detail={detail} />
              </div>
            )}

            {activeView === 'hotspots' && (
              <Panel title="Ranked Hotspots" eyebrow={`${hotspots.length} matches`}>
                <HotspotTable rows={hotspots} selectedH3={selectedH3} onSelect={setSelectedH3} />
              </Panel>
            )}

            {activeView === 'explain' && <HotspotDetail detail={detail} />}

            {activeView === 'deployment' && (
              <DeploymentView deployment={deployment} selectedH3={selectedH3} onSelect={setSelectedH3} />
            )}

            {activeView === 'evidence' && <EvidenceView evidence={evidence} />}
          </motion.section>
        </AnimatePresence>
      </main>
    </div>
  );
}
