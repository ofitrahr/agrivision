import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import MapCanvasToolbar from './MapCanvasToolbar';
import NdviPanel from './panels/NdviPanel';
import SocPanel from './panels/SocPanel';
import BiomassPanel from './panels/BiomassPanel';
import NpkPanel from './panels/NpkPanel';
import YieldPanel from './panels/YieldPanel';
import ErrorBoundary from '../../../shared/components/ErrorBoundary';
import api from '../../../shared/api/axios';

const MONTH_NAMES_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

// 5 bulan berurutan berakhir di bulan berjalan, dipakai sebelum daftar periode asli dari API tersedia
const buildFallbackPeriods = () => {
  const now = new Date();
  const periods = [];
  for (let offset = 4; offset >= 0; offset--) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const id = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    periods.push({ id, label: `${MONTH_NAMES_ID[d.getMonth()]} ${d.getFullYear()}` });
  }
  return periods;
};

const FALLBACK_PERIODS = buildFallbackPeriods();

const AgronomyDetailView = ({
  farm,
  mapHtml,
  loading,
  errorMsg,
  onBack,
  onLayerChange,
  selectedLayer,
  selectedPeriod,
  onPeriodChange,
  permissions,
}) => {
  const [periods, setPeriods] = useState(FALLBACK_PERIODS);
  const [currentPeriodIdx, setCurrentPeriodIdx] = useState(0);
  const [opacity, setOpacity] = useState(82);
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [activeSubLayer, setActiveSubLayer] = useState('nitrogen');

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

  // Periode yang sedang aktif pada time slider (dipakai untuk fetch statistik & notifikasi ke parent)
  const activePeriodId = periods[currentPeriodIdx]?.id ?? periods[periods.length - 1]?.id ?? null;

  useEffect(() => {
    if (!farm?.id || periods.length === 0) return;

    // When selectedLayer is soilnpk, we fetch based on activeSubLayer
    let fetchLayer = selectedLayer;
    if (selectedLayer === 'soilnpk') {
      fetchLayer = activeSubLayer;
      onLayerChange(activeSubLayer); // Keep map in sync
    } else if (['nitrogen', 'phosphorus', 'potassium'].includes(selectedLayer)) {
      fetchLayer = selectedLayer;
    }

    fetchStats(farm.id, fetchLayer, activePeriodId);
  }, [farm?.id, selectedLayer, currentPeriodIdx, fetchStats, periods, activeSubLayer, onLayerChange, activePeriodId]);

  // Beri tahu parent (ManagerAgronomy) setiap kali periode berganti, supaya peta Folium
  // ikut dimuat ulang untuk bulan yang dipilih. Sengaja dipisah dari effect di atas agar
  // pergantian layer saja (tanpa ganti periode) tidak memicu fetch peta yang duplikat.
  useEffect(() => {
    if (!activePeriodId || !onPeriodChange || activePeriodId === selectedPeriod) return;
    onPeriodChange(activePeriodId);
  }, [activePeriodId, onPeriodChange, selectedPeriod]);

  const handleSubLayerChange = (layer) => {
    setActiveSubLayer(layer);
    onLayerChange(layer); // Tell parent to load map for new sublayer
  };

  const handleParentLayerChange = (layer) => {
    if (layer === 'soilnpk') {
      onLayerChange(activeSubLayer);
    } else {
      onLayerChange(layer);
    }
  };

  // Determine which panel to render
  const renderLeftPanel = () => {
    const actualLayer = ['nitrogen', 'phosphorus', 'potassium'].includes(selectedLayer)
      ? 'soilnpk' : selectedLayer;

    switch(actualLayer) {
      case 'ndvi':
        return <NdviPanel statsData={statsData} statsLoading={statsLoading} farm={farm} />;
      case 'soc':
        return <SocPanel statsData={statsData} statsLoading={statsLoading} farm={farm} />;
      case 'biomass':
        return <BiomassPanel statsData={statsData} statsLoading={statsLoading} farm={farm} />;
      case 'soilnpk':
        return (
          <NpkPanel
            statsData={statsData}
            statsLoading={statsLoading}
            farm={farm}
            activeSubLayer={['nitrogen', 'phosphorus', 'potassium'].includes(selectedLayer) ? selectedLayer : activeSubLayer}
            onSubLayerChange={handleSubLayerChange}
          />
        );
      case 'yield':
        return <YieldPanel statsData={statsData} statsLoading={statsLoading} />;
      default:
        return <div className="agro-panel agro-panel-left">Pilih layer di peta</div>;
    }
  };

  return (
    <div>
      {/* Breadcrumb Header */}
      <div className="agro-breadcrumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="agro-breadcrumb-link" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Agronomi</span>
          </button>
          <span className="agro-breadcrumb-separator">/</span>
          <span className="agro-breadcrumb-current">{farm?.name || 'Detail Lahan'}</span>
        </div>
        {farm && (
          <div className="agro-chip-group" style={{ marginBottom: 0, display: 'flex', gap: '6px' }}>
            {farm.total_area_ha && <span className="agro-chip">{farm.total_area_ha} Ha</span>}
            {(farm.crop_variety || farm.crops?.[0]?.variety) && (
              <span className="agro-chip agro-chip-active">{farm.crop_variety || farm.crops?.[0]?.variety}</span>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="agro-error">
          <strong>Akses Terbatas: </strong>{errorMsg}
        </div>
      )}

      {/* 2-Column Grid */}
      <div className="agro-dashboard-grid">
        <ErrorBoundary key={selectedLayer}>
          {renderLeftPanel()}
        </ErrorBoundary>

        {/* Center Panel - Map */}
        <div className="agro-map-section">
          <MapCanvasToolbar
            mapHtml={mapHtml}
            selectedLayer={selectedLayer}
            onLayerChange={handleParentLayerChange}
            periodIdx={currentPeriodIdx}
            onPeriodChange={setCurrentPeriodIdx}
            opacity={opacity}
            onOpacityChange={setOpacity}
            permissions={permissions}
            loading={loading}
            periods={periods}
          />
        </div>
      </div>
    </div>
  );
};

export default AgronomyDetailView;
