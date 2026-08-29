import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import MapCanvasToolbar from './MapCanvasToolbar';
import KpiStrip from './KpiStrip';
import NdviPanel from './panels/NdviPanel';
import SocPanel from './panels/SocPanel';
import BiomassPanel from './panels/BiomassPanel';
import NpkPanel from './panels/NpkPanel';
import YieldPanel from './panels/YieldPanel';
import api from '../../../shared/api/axios';

const FALLBACK_PERIODS = [
  { id: 'Q1_2025', label: 'Jan - Mar 2025' },
  { id: 'Q2_2025', label: 'Apr - Jun 2025' },
  { id: 'Q3_2025', label: 'Jul - Sep 2025' },
  { id: 'Q4_2025', label: 'Okt - Des 2025' },
  { id: 'Q1_2026', label: 'Jan - Mar 2026' },
];

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

  useEffect(() => {
    if (!farm?.id || periods.length === 0) return;
    const period = periods[currentPeriodIdx]?.id ?? periods[periods.length - 1]?.id;
    
    // When selectedLayer is soilnpk, we fetch based on activeSubLayer
    let fetchLayer = selectedLayer;
    if (selectedLayer === 'soilnpk') {
      fetchLayer = activeSubLayer;
      onLayerChange(activeSubLayer); // Keep map in sync
    } else if (['nitrogen', 'phosphorus', 'potassium'].includes(selectedLayer)) {
      fetchLayer = selectedLayer;
    }
    
    fetchStats(farm.id, fetchLayer, period);
  }, [farm?.id, selectedLayer, currentPeriodIdx, fetchStats, periods, activeSubLayer, onLayerChange]);

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

      {/* 2-Column Grid */}
      <div className="agro-dashboard-grid">
        {renderLeftPanel()}

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

      {/* Sticky KPI Strip */}
      <KpiStrip 
        selectedLayer={selectedLayer} 
        activeSubLayer={['nitrogen', 'phosphorus', 'potassium'].includes(selectedLayer) ? selectedLayer : activeSubLayer} 
        statsData={statsData} 
        farm={farm} 
      />
    </div>
  );
};

export default AgronomyDetailView;
