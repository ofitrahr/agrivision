import { DistributionChart, TrendChart, AnomalyWarning, SummaryStats } from './CommonComponents';

const NdviPanel = ({ statsData, statsLoading, farm }) => {
  const anomalyHa = statsData?.anomaly?.count != null && farm?.total_area_ha && statsData?.stats?.total_count
    ? ((statsData.anomaly.count / statsData.stats.total_count) * farm.total_area_ha).toFixed(2)
    : null;

  return (
    <div className="agro-panel agro-panel-left">
      <h2 style={{ fontSize: 16, marginTop: 0, marginBottom: 16, color: '#116a3a' }}>Index Kesehatan Tanaman (NDVI)</h2>
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
