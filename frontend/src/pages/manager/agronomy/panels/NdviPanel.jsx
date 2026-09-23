import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { DistributionChart, TrendChart, AnomalyWarning, SummaryStats } from './CommonComponents';
import { getStoredSettings } from '../../../../shared/utils/settingsHelper';

const NdviPanel = ({ statsData, statsLoading, farm }) => {
  const { t } = useTranslation();
  const [ndviThreshold, setNdviThreshold] = useState(() => getStoredSettings().ndviThreshold);

  // Ikuti perubahan ambang batas dari halaman Settings
  useEffect(() => {
    const handleUpdate = () => setNdviThreshold(getStoredSettings().ndviThreshold);
    window.addEventListener('settingsUpdated', handleUpdate);
    return () => window.removeEventListener('settingsUpdated', handleUpdate);
  }, []);

  const anomalyHa = statsData?.anomaly?.count != null && farm?.total_area_ha && statsData?.stats?.total_count
    ? ((statsData.anomaly.count / statsData.stats.total_count) * farm.total_area_ha).toFixed(2)
    : null;

  const meanNdvi = statsData?.stats?.mean;
  const hasMean = !statsLoading && typeof meanNdvi === 'number';
  const isStressed = hasMean && meanNdvi < ndviThreshold;
  const statusParams = { mean: hasMean ? meanNdvi.toFixed(3) : '-', threshold: Number(ndviThreshold).toFixed(2) };

  return (
    <div className="agro-panel agro-panel-left">
      <h2 style={{ fontSize: 16, marginTop: 0, marginBottom: 16, color: '#116a3a' }}>Index Kesehatan Tanaman (NDVI)</h2>

      {/* Status vegetasi terhadap ambang batas NDVI dari Settings */}
      {hasMean && (
        <div className="agro-panel-section">
          {isStressed ? (
            <div className="agro-anomaly-box">
              <div className="agro-anomaly-header">
                <AlertTriangle size={16} color="#c0392b" />
                <span className="agro-panel-label">{t('ndvi.stressWarning')}</span>
              </div>
              <div className="agro-anomaly-desc">{t('ndvi.stressDesc', statusParams)}</div>
            </div>
          ) : (
            <>
              <span className="badge badge-success">{t('ndvi.healthy')}</span>
              <div className="agro-anomaly-desc" style={{ marginTop: 6 }}>{t('ndvi.healthyDesc', statusParams)}</div>
            </>
          )}
        </div>
      )}

      <DistributionChart histogram={statsData?.histogram} loading={statsLoading} layerLabel="NDVI" />
      <AnomalyWarning anomaly={statsData?.anomaly} anomalyHa={anomalyHa} anomalyPercent={statsData?.anomaly?.percent ?? 0} selectedLayer="NDVI" />
      <div className="agro-panel-divider" />
      <SummaryStats stats={statsData?.stats} loading={statsLoading} />
      <div className="agro-panel-divider" />
      <TrendChart trendData={statsData?.trend} loading={statsLoading} />
    </div>
  );
};
export default NdviPanel;
