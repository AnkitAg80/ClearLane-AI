import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  BrainCircuit,
  Crosshair,
  Database,
  Home,
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
  getConfig,
  getHotspotDetail,
  getHotspots,
  getMapRows,
  getOverview,
  optimizeDeployment,
} from './api';
import BudgetCard from './components/BudgetCard';
import CommandMap from './components/CommandMap';
import DeploymentsView from './components/DeploymentsView';
import EvidenceView from './components/EvidenceView';
import HomeView from './components/HomeView';
import HotspotDetail from './components/HotspotDetail';
import HotspotTable from './components/HotspotTable';
import MetricCard from './components/MetricCard';
import Panel from './components/Panel';
import Toolbar from './components/Toolbar';

const views = [
  { id: 'home', label: 'Dashboard', icon: Home },
  { id: 'command', label: 'Command Center', icon: Map },
  { id: 'deployments', label: 'Active Deployments', icon: Route },
  { id: 'explain', label: 'AI Explanation Console', icon: Target },
  { id: 'evidence', label: 'AI Trust Console', icon: BrainCircuit },
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
      <strong>Loading ClearLane AI Command Center</strong>
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
  const [appConfig, setAppConfig] = useState(null);
  const [mapRows, setMapRows] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [deployment, setDeployment] = useState(null);
  const [evidence, setEvidence] = useState(null);
  const [detail, setDetail] = useState(null);
  const [activeView, setActiveView] = useState('home');
  const [selectedH3, setSelectedH3] = useState(null);
  const [station, setStation] = useState('ALL');
  const [query, setQuery] = useState('');
  const [metricMode, setMetricMode] = useState('deployment_score');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
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
      getConfig().then(setAppConfig).catch(() => setAppConfig(null));
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

  const handleOptimize = async (budget) => {
    setOptimizing(true);
    setError('');
    try {
      await optimizeDeployment(budget);
      await loadStaticData();
      setLastUpdated(Date.now());
    } catch (err) {
      setError(err.message || 'Unable to optimize deployment.');
    } finally {
      setOptimizing(false);
    }
  };

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
        if (!selectedH3 || !nextHotspots.find(h => h.h3 === selectedH3)) {
          setSelectedH3(nextHotspots[0]?.h3 || null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unable to load filtered command data.');
      }
    }
    loadFilteredData();
    return () => {
      cancelled = true;
    };
  }, [filters, selectedH3, lastUpdated]);

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
  const searchSuggestions = overview?.filters?.suggestions || [];
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
            <strong>ClearLane AI</strong>
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
            {activeView === 'home' && (
              <>
                <span className="kicker">Next-3-hour forecast and officer allocation</span>
                <h1>Operational deployment cockpit</h1>
              </>
            )}
            {activeView === 'command' && (
              <>
                <span className="kicker">Live traffic monitoring</span>
                <h1>Command Center</h1>
              </>
            )}
            {activeView === 'deployments' && (
              <>
                <span className="kicker">Resource allocation</span>
                <h1>Active Deployments</h1>
              </>
            )}
            {activeView === 'explain' && (
              <>
                <span className="kicker">Hotspot diagnosis</span>
                <h1>AI Explanation Console</h1>
              </>
            )}
            {activeView === 'evidence' && (
              <>
                <span className="kicker">Model validation</span>
                <h1>AI Trust Console</h1>
              </>
            )}
          </div>
        </header>

        {activeView !== 'home' && activeView !== 'deployments' && activeView !== 'evidence' && (
          <Toolbar
            stations={stations}
            searchSuggestions={searchSuggestions}
            station={station}
            setStation={setStation}
            query={query}
            setQuery={setQuery}
            metricMode={metricMode}
            setMetricMode={setMetricMode}
            activeView={activeView}
          />
        )}

        {activeView !== 'home' && activeView !== 'deployments' && activeView !== 'explain' && (
          <section className="metrics-grid metrics-grid--compact" aria-label="Command summary">
            <BudgetCard
              deployedCount={summary.officers_deployed}
              onOptimize={handleOptimize}
              isLoading={optimizing}
            />
            <MetricCard icon={Activity} label="Deployed Places" value={summary.active_cells ?? 0} tone="info" tooltip="Number of places receiving at least one assigned officer in the current deployment plan." />
            <MetricCard icon={TrendingUp} label="Expected CII Relief" value={formatNumber(summary.expected_relief)} sublabel="CII reduction units" tone="success" tooltip="Estimated reduction in Congestion Impact Index units achieved by executing this deployment plan. This is not a percentage." />
            <MetricCard icon={ShieldAlert} label="AI Optimization Lift" value={`${formatNumber(highlights.lift_pct, 1)}%`} tone="warning" tooltip="Percentage improvement in congestion relief compared to a reactive, purely historical deployment." />
          </section>
        )}

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
            {activeView === 'home' && (
              <HomeView setActiveView={setActiveView} />
            )}

            {activeView === 'command' && (
              <div className="command-layout">
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--line)' }}>
                  <CommandMap
                    rows={mapRows}
                    bbox={overview?.bbox}
                    selectedH3={selectedH3}
                    onSelect={setSelectedH3}
                    metricMode={metricMode}
                    mapConfig={appConfig}
                  />
                </div>
                <HotspotDetail detail={detail} compact={true} />
              </div>
            )}

            {activeView === 'deployments' && (
              <DeploymentsView 
                overview={overview}
                deployment={deployment}
                hotspots={hotspots} 
                selectedH3={selectedH3} 
                onSelect={setSelectedH3} 
                onOptimize={handleOptimize}
                isLoading={optimizing}
                toolbarProps={{
                  stations,
                  searchSuggestions,
                  station,
                  setStation,
                  query,
                  setQuery,
                  metricMode,
                  setMetricMode,
                  activeView
                }}
              />
            )}

            {activeView === 'explain' && <HotspotDetail detail={detail} />}

            {activeView === 'evidence' && <EvidenceView evidence={evidence} />}
          </motion.section>
        </AnimatePresence>
      </main>
    </div>
  );
}
