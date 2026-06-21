import Panel from './Panel';
import HotspotTable from './HotspotTable';
import DeploymentConsole from './DeploymentConsole';
import Toolbar from './Toolbar';

export default function DeploymentsView({ overview, deployment, hotspots, selectedH3, onSelect, onOptimize, isLoading, toolbarProps }) {
  return (
    <div className="view-stack">
      <DeploymentConsole 
        overview={overview} 
        deployment={deployment} 
        onOptimize={onOptimize} 
        isLoading={isLoading} 
      />
      
      <div style={{ marginTop: '12px' }}>
        <Toolbar {...toolbarProps} />
        <Panel title="Deployment Plan" eyebrow={`${hotspots.length} matches`}>
          <HotspotTable rows={hotspots} selectedH3={selectedH3} onSelect={onSelect} />
        </Panel>
      </div>
    </div>
  );
}
