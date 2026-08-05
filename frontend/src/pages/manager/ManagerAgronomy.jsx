import { useEffect, useState, useCallback } from 'react';
import api from '../../shared/api/axios';
import { useLocation } from 'react-router-dom';
import FarmSelectorView from './agronomy/FarmSelectorView';
import AgronomyDetailView from './agronomy/AgronomyDetailView';

const ManagerAgronomy = () => {
  const location = useLocation();
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [mapHtml, setMapHtml] = useState('');
  const [selectorMapHtml, setSelectorMapHtml] = useState('');
  const [mapLoading, setMapLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedLayer, setSelectedLayer] = useState('ndvi');
  const [permissions, setPermissions] = useState(null);
  const [viewMode, setViewMode] = useState('selector');

  const loadSelectorMap = useCallback(async (farmId) => {
    setMapLoading(true);
    try {
      const mapRes = await api.get(`/manager/farms/${farmId}/map`);
      if (mapRes.data.success && mapRes.data.data?.html) {
        setSelectorMapHtml(mapRes.data.data.html);
      } else {
        const agroRes = await api.get(`/manager/farms/${farmId}/agronomy-map?layer=ndvi`);
        if (agroRes.data.success) {
          setSelectorMapHtml(agroRes.data.data.html);
        }
      }
    } catch (err) {
      console.warn('Map preview fallback:', err);
    } finally {
      setMapLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFarms();
  }, []);

  const fetchFarms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/manager/farms');
      if (response.data.success) {
        const farmList = response.data.data;
        setFarms(farmList);
        if (response.data.permissions) {
          setPermissions(response.data.permissions);
        }

        const params = new URLSearchParams(location.search);
        const queryFarmId = params.get('farm_id');
        if (queryFarmId) {
          const farm = farmList.find((f) => String(f.id) === queryFarmId);
          if (farm) {
            setSelectedFarm(farm);
            setViewMode('detail');
            loadAgronomyMap(farm.id, selectedLayer);
          }
        } else if (farmList.length > 0) {
          setSelectedFarm(farmList[0]);
          loadSelectorMap(farmList[0].id);
        }
      }
    } catch (error) {
      console.error('Gagal memuat data lahan:', error);
      setErrorMsg('Gagal memuat data lahan.');
    } finally {
      setLoading(false);
    }
  };

  const loadAgronomyMap = useCallback(
    async (farmId, layer = selectedLayer) => {
      setLoading(true);
      setErrorMsg('');
      setMapHtml('');
      try {
        const mapRes = await api.get(
          `/manager/farms/${farmId}/agronomy-map?layer=${layer}`
        );
        if (mapRes.data.success) {
          setMapHtml(mapRes.data.data.html);
        }
      } catch (error) {
        if (error.response && error.response.status === 403) {
          setErrorMsg(error.response.data.message || 'Akses ditolak.');
        } else {
          setErrorMsg('Gagal memuat peta agronomi.');
        }
      } finally {
        setLoading(false);
      }
    },
    [selectedLayer]
  );

  const handleSelectFarm = useCallback((farm) => {
    setSelectedFarm(farm);
    loadSelectorMap(farm.id);
  }, [loadSelectorMap]);

  const handleViewDetail = useCallback(
    (farm) => {
      setSelectedFarm(farm);
      setViewMode('detail');
      loadAgronomyMap(farm.id, selectedLayer);
    },
    [loadAgronomyMap, selectedLayer]
  );

  const handleBackToSelector = useCallback(() => {
    setViewMode('selector');
    setMapHtml('');
    setErrorMsg('');
  }, []);

  const handleLayerChange = useCallback(
    (layer) => {
      setSelectedLayer(layer);
      if (selectedFarm) {
        loadAgronomyMap(selectedFarm.id, layer);
      }
    },
    [selectedFarm, loadAgronomyMap]
  );

  if (viewMode === 'detail' && selectedFarm) {
    return (
      <AgronomyDetailView
        farm={selectedFarm}
        mapHtml={mapHtml}
        loading={loading}
        errorMsg={errorMsg}
        onBack={handleBackToSelector}
        onLayerChange={handleLayerChange}
        selectedLayer={selectedLayer}
        permissions={permissions}
      />
    );
  }

  return (
    <FarmSelectorView
      farms={farms}
      selectedFarm={selectedFarm}
      onSelectFarm={handleSelectFarm}
      onViewDetail={handleViewDetail}
      loading={loading}
      mapLoading={mapLoading}
      selectorMapHtml={selectorMapHtml}
      permissions={permissions}
    />
  );
};

export default ManagerAgronomy;
