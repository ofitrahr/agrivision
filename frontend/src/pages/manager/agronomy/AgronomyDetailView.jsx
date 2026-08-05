import { useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, BarChart3 } from 'lucide-react';
import PanelLeftStats from './PanelLeftStats';
import MapCanvasToolbar from './MapCanvasToolbar';
import PanelRightTrends from './PanelRightTrends';

const PERIODS = [
  { id: 'Q1_2025', label: 'Jan - Mar 2025' },
  { id: 'Q2_2025', label: 'Apr - Jun 2025' },
  { id: 'Q3_2025', label: 'Jul - Sep 2025' },
  { id: 'Q4_2025', label: 'Okt - Des 2025' },
  { id: 'Q1_2026', label: 'Jan - Mar 2026' },
];

const PARAMS = {
  ndvi:    { label: 'Kesehatan Tanaman (NDVI)', unit: 'index',      desc: 'Indeks kehijauan daun (0-1). Menunjukkan tingkat fotosintesis dan kesehatan tanaman.' },
  yield:   { label: 'Estimasi Produksi (Yield)', unit: 'Ton/Ha',     desc: 'Estimasi produksi buah kopi (Ton/Ha).' },
  soc:     { label: 'Stok Karbon Tanah (SOC)',  unit: 'Ton C/Ha',   desc: 'Kandungan Karbon Organik Tanah (Ton C/Ha) pada kedalaman 20cm.' },
  biomass: { label: 'Biomassa Karbon',          unit: 'Kg C/Ha',    desc: 'Estimasi biomassa karbon di atas permukaan tanah.' },
  soilnpk: { label: 'Nutrisi Tanah (NPK)',      unit: 'kg NPK/Ha',  desc: 'Total NPK tanah (kg/Ha) pada kedalaman 20cm.' },
};

const MOCK_KPI = [
  { label: 'Rerata', value: '42.156', unit: 'Ton C/Ha', icon: BarChart3, trend: null },
  { label: 'Perubahan (Q-o-Q)', value: '+1.24', unit: 'Ton C/Ha', icon: TrendingUp, trend: 'up' },
  { label: 'Min', value: '28.340', unit: 'Ton C/Ha', icon: null, trend: null },
  { label: 'Max', value: '55.120', unit: 'Ton C/Ha', icon: null, trend: null },
  { label: 'Area Anomali', value: '2.50 Ha (10%)', unit: '', icon: AlertTriangle, trend: 'down' },
];

const AgronomyDetailView = ({
  farm,
  mapHtml,
  loading,
  errorMsg,
  onBack,
  onLayerChange,
  selectedLayer,
  permissions
}) => {
  const [currentPeriodIdx, setCurrentPeriodIdx] = useState(4);
  const [opacity, setOpacity] = useState(82);

  const currentPeriod = PERIODS[currentPeriodIdx];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="agro-breadcrumb">
        <button className="agro-breadcrumb-link" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Agronomi</span>
        </button>
        <span className="agro-breadcrumb-separator">/</span>
        <span className="agro-breadcrumb-current">{farm?.name || 'Detail Lahan'}</span>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="agro-error">
          <strong>Akses Terbatas: </strong>{errorMsg}
        </div>
      )}

      {/* 3-Column Grid */}
      <div className="agro-dashboard-grid">
        {/* Left Panel */}
        <div className="agro-panel agro-panel-left">
          <PanelLeftStats
            selectedLayer={selectedLayer}
            periodIdx={currentPeriodIdx}
            farm={farm}
          />
        </div>

        {/* Center Panel - Map */}
        <div className="agro-map-section">
          <MapCanvasToolbar
            mapHtml={mapHtml}
            selectedLayer={selectedLayer}
            onLayerChange={onLayerChange}
            periodIdx={currentPeriodIdx}
            onPeriodChange={setCurrentPeriodIdx}
            opacity={opacity}
            onOpacityChange={setOpacity}
            permissions={permissions}
            loading={loading}
          />
        </div>

        {/* Right Panel */}
        <div className="agro-panel agro-panel-right">
          <PanelRightTrends
            selectedLayer={selectedLayer}
            periodIdx={currentPeriodIdx}
            farm={farm}
          />
        </div>
      </div>

      {/* KPI Strip */}
      <div className="agro-kpi-strip">
        {MOCK_KPI.map((kpi, idx) => {
          const Icon = kpi.icon;
          const valClass = kpi.trend === 'up' ? 'agro-kpi-up' : kpi.trend === 'down' ? 'agro-kpi-down' : '';
          return (
            <div key={idx} className="agro-kpi-card">
              <div className="agro-kpi-label">{kpi.label}</div>
              <div className={`agro-kpi-val ${valClass}`}>
                {Icon && <Icon size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} />}
                {kpi.value} {kpi.unit}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgronomyDetailView;
