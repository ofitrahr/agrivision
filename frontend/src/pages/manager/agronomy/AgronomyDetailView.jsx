import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';
import PanelLeftStats from './PanelLeftStats';
import MapCanvasToolbar from './MapCanvasToolbar';
import PanelRightTrends from './PanelRightTrends';
import api from '../../../shared/api/axios';

const FALLBACK_PERIODS = [
  { id: 'Q1_2025', label: 'Jan - Mar 2025' },
  { id: 'Q2_2025', label: 'Apr - Jun 2025' },
  { id: 'Q3_2025', label: 'Jul - Sep 2025' },
  { id: 'Q4_2025', label: 'Okt - Des 2025' },
  { id: 'Q1_2026', label: 'Jan - Mar 2026' },
];

const PARAMS = {
  ndvi:    { label: 'Kesehatan Tanaman (NDVI)', unit: 'index' },
  yield:   { label: 'Estimasi Produksi (Yield)', unit: 'Ton/Ha' },
  soc:     { label: 'Stok Karbon Tanah (SOC)',  unit: 'Ton C/Ha' },
  biomass: { label: 'Biomassa Karbon',          unit: 'Kg C/Ha' },
  soilnpk: { label: 'Nutrisi Tanah (NPK)',      unit: 'kg NPK/Ha' },
};

const AgronomyDetailView = ({
  farm,
  mapHtml,
  loading,
  errorMsg,
  onBack,
  onLayerChange,
  selectedLayer,
  permissions,
}) => {
  const [periods, setPeriods] = useState(FALLBACK_PERIODS);
  const [currentPeriodIdx, setCurrentPeriodIdx] = useState(0);
  const [opacity, setOpacity] = useState(82);
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        const res = await api.get('/manager/available-periods');
        if (res.data.success && res.data.data.length > 0) {
          setPeriods(res.data.data);
          setCurrentPeriodIdx(res.data.data.length - 1);
        }
      } catch (err) {
        console.warn('Gagal memuat daftar periode, menggunakan fallback:', err);
      }
    };
    fetchPeriods();
  }, []);

  const fetchStats = useCallback(async (farmId, layer, period) => {
    setStatsLoading(true);
    try {
      const res = await api.get(
        `/manager/farms/${farmId}/agronomy-stats?layer=${layer}&period=${period}`
      );
      if (res.data.success) {
        setStatsData(res.data.data);
      }
    } catch (err) {
      console.warn('Gagal memuat statistik agronomi:', err);
      setStatsData(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!farm?.id || periods.length === 0) return;
    const period = periods[currentPeriodIdx]?.id ?? periods[periods.length - 1]?.id;
    fetchStats(farm.id, selectedLayer, period);
  }, [farm?.id, selectedLayer, currentPeriodIdx, fetchStats, periods]);

  const unit = PARAMS[selectedLayer]?.unit ?? '';

  const buildKpi = () => {
    if (!statsData?.has_data) return [];
    const { stats, anomaly } = statsData;
    const anomalyHa = anomaly?.count != null && farm?.total_area_ha
      ? ((anomaly.count / (statsData.stats.total_count || 1)) * farm.total_area_ha).toFixed(2)
      : '-';
    return [
      { label: 'Rerata',          value: stats.mean?.toFixed(3) ?? '-', unit, icon: BarChart3,     trend: null },
      { label: 'Min',             value: stats.min?.toFixed(3) ?? '-',  unit, icon: null,          trend: null },
      { label: 'Max',             value: stats.max?.toFixed(3) ?? '-',  unit, icon: null,          trend: null },
      { label: 'Std Deviasi',     value: stats.std_dev?.toFixed(3) ?? '-', unit, icon: null,       trend: null },
      { label: 'Area Anomali',    value: `${anomalyHa} Ha (${anomaly?.percent?.toFixed(1) ?? 0}%)`, unit: '', icon: AlertTriangle, trend: 'down' },
    ];
  };

  const kpiItems = buildKpi();

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
            statsData={statsData}
            statsLoading={statsLoading}
            periods={periods}
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
            periods={periods}
          />
        </div>

        {/* Right Panel */}
        <div className="agro-panel agro-panel-right">
          <PanelRightTrends
            selectedLayer={selectedLayer}
            periodIdx={currentPeriodIdx}
            farm={farm}
            statsData={statsData}
          />
        </div>
      </div>

      {/* KPI Strip */}
      {kpiItems.length > 0 && (
        <div className="agro-kpi-strip">
          {kpiItems.map((kpi, idx) => {
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
      )}
    </div>
  );
};

export default AgronomyDetailView;
