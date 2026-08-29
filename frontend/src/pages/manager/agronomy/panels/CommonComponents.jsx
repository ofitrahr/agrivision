import { AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export const DistributionChart = ({ histogram, loading }) => (
  <div className="agro-panel-section">
    <div className="agro-panel-label">Distribusi Data (per Hektar)</div>
    <div className="agro-chart-wrapper">
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 12 }}>Memuat...</div>
      ) : histogram && histogram.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={histogram} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis dataKey="bin" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} formatter={(val) => [`${val} Ha`, 'Area']} />
            <Bar dataKey="area_ha" fill="#116a3a" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 12 }}>Belum ada data</div>
      )}
    </div>
  </div>
);

export const TrendChart = ({ trendData, loading, forecast }) => {
  // If forecast exists, we can append it to trend data for visualization
  const data = [...(trendData || [])];
  if (forecast && data.length > 0) {
    data.push({
      period: forecast.period,
      value: null, // Will use forecast_value
      forecast_value: forecast.value
    });
    // Set the last actual data point to connect to forecast
    data[data.length - 2].forecast_value = data[data.length - 2].value;
  }

  return (
    <div className="agro-panel-section">
      <div className="agro-panel-label">Tren Lintas Waktu</div>
      <div className="agro-chart-wrapper-tall">
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Memuat...</div>
        ) : data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <XAxis dataKey="period" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} domain={['dataMin - 1', 'dataMax + 1']} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
              <Area type="monotone" dataKey="value" stroke="#116a3a" strokeWidth={2} fill="#116a3a" fillOpacity={0.1} />
              {forecast && (
                <Area type="monotone" dataKey="forecast_value" stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 3" fill="#f59e0b" fillOpacity={0.1} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Belum ada data</div>
        )}
      </div>
    </div>
  );
};

export const AnomalyWarning = ({ anomaly, anomalyHa, anomalyPercent, selectedLayer }) => {
  if (!anomaly || anomaly.count === 0) return null;
  return (
    <>
      <div className="agro-panel-divider" />
      <div className="agro-panel-section">
        <div className="agro-anomaly-header">
          <AlertTriangle size={16} color="#c0392b" />
          <span className="agro-panel-label" style={{ color: '#c0392b', marginBottom: 0 }}>PERINGATAN ANOMALI</span>
        </div>
        <div className="agro-anomaly-box">
          <div className="agro-anomaly-stat">
            <span className="agro-anomaly-count">{anomalyHa} Ha</span>
            <span className="agro-anomaly-percent">({anomalyPercent.toFixed(1)}%)</span>
          </div>
          <div className="agro-anomaly-desc">Anomali terdeteksi pada layer {selectedLayer?.toUpperCase()}</div>
        </div>
      </div>
    </>
  );
};

export const SummaryStats = ({ stats, loading }) => (
  <div className="agro-panel-section">
    <div className="agro-panel-label">Statistik Ringkasan</div>
    {loading ? (
      <div className="agro-stats-box" style={{ textAlign: 'center', fontSize: 12 }}>Memuat...</div>
    ) : stats ? (
      <div className="agro-stats-box">
        <div className="agro-stat-item"><span className="agro-stat-label">Mean</span><span className="agro-stat-val">{stats.mean?.toFixed(3) ?? '-'}</span></div>
        <div className="agro-stat-item"><span className="agro-stat-label">Min</span><span className="agro-stat-val">{stats.min?.toFixed(3) ?? '-'}</span></div>
        <div className="agro-stat-item"><span className="agro-stat-label">Max</span><span className="agro-stat-val">{stats.max?.toFixed(3) ?? '-'}</span></div>
        <div className="agro-stat-item"><span className="agro-stat-label">Std Dev</span><span className="agro-stat-val">{stats.std_dev?.toFixed(3) ?? '-'}</span></div>
      </div>
    ) : null}
  </div>
);
