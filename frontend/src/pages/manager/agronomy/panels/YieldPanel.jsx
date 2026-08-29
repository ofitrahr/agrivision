import { TrendChart, SummaryStats } from './CommonComponents';

const YieldPanel = ({ statsData, statsLoading }) => {
  return (
    <div className="agro-panel agro-panel-left">
      <h2 style={{ fontSize: 16, marginTop: 0, marginBottom: 16, color: '#116a3a' }}>Estimasi Produksi (Yield)</h2>
      <TrendChart trendData={statsData?.trend} forecast={statsData?.forecast} loading={statsLoading} />
      <div className="agro-panel-divider" />
      <SummaryStats stats={statsData?.stats} loading={statsLoading} />
    </div>
  );
};
export default YieldPanel;
