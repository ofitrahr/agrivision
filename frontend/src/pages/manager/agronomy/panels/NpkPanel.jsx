import { DistributionChart, AnomalyWarning } from './CommonComponents';
import { Activity } from 'lucide-react';

const NpkPanel = ({ statsData, statsLoading, farm, activeSubLayer, onSubLayerChange }) => {
  const anomalyHa = statsData?.anomaly?.count != null && farm?.total_area_ha && statsData?.stats?.total_count
    ? ((statsData.anomaly.count / statsData.stats.total_count) * farm.total_area_ha).toFixed(2) : null;
  const sensor = statsData?.sensor_data;

  return (
    <div className="agro-panel agro-panel-left">
      <h2 style={{ fontSize: 16, marginTop: 0, marginBottom: 16, color: '#116a3a' }}>Nutrisi Tanah (NPK)</h2>
      
      {/* Sub-layer toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['nitrogen', 'phosphorus', 'potassium'].map(layer => (
          <button 
            key={layer}
            onClick={() => onSubLayerChange(layer)}
            style={{
              flex: 1, padding: '6px', borderRadius: 20, border: '1px solid #116a3a', 
              background: activeSubLayer === layer ? '#116a3a' : 'transparent',
              color: activeSubLayer === layer ? 'white' : '#116a3a',
              cursor: 'pointer', fontSize: 12, fontWeight: 600
            }}
          >
            {layer === 'nitrogen' ? 'Nitrogen (N)' : layer === 'phosphorus' ? 'Fosfor (P)' : 'Kalium (K)'}
          </button>
        ))}
      </div>

      <DistributionChart histogram={statsData?.histogram} loading={statsLoading} layerLabel={activeSubLayer} />
      <AnomalyWarning anomaly={statsData?.anomaly} anomalyHa={anomalyHa} anomalyPercent={statsData?.anomaly?.percent ?? 0} selectedLayer={activeSubLayer} />
      
      <div className="agro-panel-divider" />
      <div className="agro-panel-section">
        <div className="agro-panel-label"><Activity size={14} style={{ display: 'inline', marginRight: 6 }} /> Data Sensor Lapangan</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <div style={{ background: '#f4f6f5', padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: '#6b7280' }}>pH Tanah</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#116a3a' }}>{sensor?.ph?.toFixed(1) ?? '-'}</div>
          </div>
          <div style={{ background: '#f4f6f5', padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Suhu</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#116a3a' }}>{sensor?.temperature?.toFixed(1) ?? '-'} °C</div>
          </div>
          <div style={{ background: '#f4f6f5', padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Konduktivitas (EC)</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#116a3a' }}>{sensor?.ec?.toFixed(0) ?? '-'} µS/cm</div>
          </div>
          <div style={{ background: '#f4f6f5', padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Kelembapan</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#116a3a' }}>{sensor?.humidity?.toFixed(1) ?? '-'} %</div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default NpkPanel;
