import { TrendChart, SummaryStats } from './CommonComponents';
import { TrendingUp } from 'lucide-react';

const YieldPanel = ({ statsData, statsLoading }) => {
  return (
    <div className="agro-panel agro-panel-left">
      <h2 style={{ fontSize: 16, marginTop: 0, marginBottom: 16, color: '#116a3a' }}>Estimasi Produksi (Yield)</h2>
      <TrendChart trendData={statsData?.trend} forecast={statsData?.forecast} loading={statsLoading} />
      <div className="agro-panel-divider" />
      <SummaryStats stats={statsData?.stats} loading={statsLoading} />
      {statsData?.forecast && (
        <>
          <div className="agro-panel-divider" />
          <div className="agro-panel-section">
            <div className="agro-panel-label" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#d97706' }}>
              <TrendingUp size={14} />
              <span>Estimasi Panen Berikutnya ({statsData.forecast.period})</span>
            </div>
            {statsData.forecast.label && (
              <div style={{ fontSize: 11, color: '#92400e', fontStyle: 'italic', marginBottom: 6 }}>
                {statsData.forecast.label}
              </div>
            )}
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>Prediksi Produktivitas</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#92400e' }}>{Number(statsData.forecast.value) ? Number(statsData.forecast.value).toFixed(2) : '-'} Ton/Ha</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default YieldPanel;
