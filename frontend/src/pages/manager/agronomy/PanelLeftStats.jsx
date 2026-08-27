import { useState } from 'react';
import { AlertTriangle, Download, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const PanelLeftStats = ({ selectedLayer, periodIdx, farm, statsData, statsLoading, periods = [] }) => {
  const [showOnMap, setShowOnMap] = useState(true);

  const period = periods[periodIdx] ?? (periods.length > 0 ? periods[periods.length - 1] : { label: 'Periode Tidak Diketahui' });
  const stats = statsData?.stats ?? null;
  const anomaly = statsData?.anomaly ?? null;
  const histogram = statsData?.histogram ?? [];
  const hasData = statsData?.has_data === true;

  const anomalyPercent = anomaly?.percent ?? 0;
  const anomalyHa = (anomaly && farm?.total_area_ha && stats?.total_count)
    ? ((anomaly.count / stats.total_count) * farm.total_area_ha).toFixed(2)
    : null;

  return (
    <>
      {/* Distribusi Data Piksel */}
      <div className="agro-panel-section">
        <div className="agro-panel-label">Distribusi Data Piksel</div>
        <p className="agro-panel-desc">
          Menampilkan distribusi nilai {selectedLayer?.toUpperCase() || 'DATA'} pada area yang dipilih.
        </p>
        <div className="agro-chart-wrapper">
          {statsLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 12, color: '#5C7A6D' }}>
              Memuat data...
            </div>
          ) : hasData && histogram.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogram} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="bin" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 6,
                    border: '1px solid #E0EBE4',
                    boxShadow: 'none',
                  }}
                />
                <Bar dataKey="count" fill="#116a3a" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 12, color: '#9CA3AF' }}>
              Belum ada data untuk periode ini
            </div>
          )}
        </div>
        <div className="agro-hist-hint">Klik area pada peta untuk detail nilai</div>
      </div>

      <div className="agro-panel-divider" />

      {/* Peringatan Anomali */}
      {hasData && anomaly && anomaly.count > 0 && (
        <>
          <div className="agro-panel-section">
            <div className="agro-anomaly-header">
              <AlertTriangle size={16} color="#c0392b" />
              <span className="agro-panel-label" style={{ color: '#c0392b', marginBottom: 0 }}>
                PERINGATAN ANOMALI
              </span>
            </div>
            <div className="agro-anomaly-box">
              <div className="agro-anomaly-stat">
                {anomalyHa !== null && (
                  <>
                    <span className="agro-anomaly-count">{anomalyHa} Ha</span>
                    <span className="agro-anomaly-total">/ {farm?.total_area_ha ?? '?'} Ha</span>
                  </>
                )}
                <span className="agro-anomaly-percent">({anomalyPercent.toFixed(1)}%)</span>
              </div>
              <div className="agro-anomaly-desc">
                {anomaly.count} titik data terdeteksi anomali pada layer {selectedLayer?.toUpperCase()}
              </div>
              <span
                className={`agro-anomaly-severity ${
                  anomalyPercent > 30
                    ? 'agro-severity-high'
                    : anomalyPercent > 10
                    ? 'agro-severity-mid'
                    : 'agro-severity-low'
                }`}
              >
                {anomalyPercent > 30 ? 'Kritis' : anomalyPercent > 10 ? 'Perlu Perhatian' : 'Ringan'}
              </span>
            </div>
            <div className="agro-toggle-wrap">
              <label className="agro-toggle-switch">
                <input
                  type="checkbox"
                  checked={showOnMap}
                  onChange={(e) => setShowOnMap(e.target.checked)}
                />
                <span className="agro-toggle-slider" />
              </label>
              <span className="agro-toggle-label">Tampilkan di Peta</span>
            </div>
          </div>
          <div className="agro-panel-divider" />
        </>
      )}

      {/* Statistik Ringkasan */}
      <div className="agro-panel-section">
        <div className="agro-panel-label">Statistik Ringkasan</div>
        {statsLoading ? (
          <div className="agro-stats-box" style={{ textAlign: 'center', fontSize: 12, color: '#5C7A6D', padding: '8px 0' }}>
            Memuat statistik...
          </div>
        ) : hasData && stats ? (
          <div className="agro-stats-box">
            <div className="agro-stat-item">
              <span className="agro-stat-label">Mean</span>
              <span className="agro-stat-val">{stats.mean?.toFixed(3) ?? '-'}</span>
            </div>
            <div className="agro-stat-item">
              <span className="agro-stat-label">Min</span>
              <span className="agro-stat-val">{stats.min?.toFixed(3) ?? '-'}</span>
            </div>
            <div className="agro-stat-item">
              <span className="agro-stat-label">Max</span>
              <span className="agro-stat-val">{stats.max?.toFixed(3) ?? '-'}</span>
            </div>
            <div className="agro-stat-item">
              <span className="agro-stat-label">Std Dev</span>
              <span className="agro-stat-val">{stats.std_dev?.toFixed(3) ?? '-'}</span>
            </div>
            <div className="agro-stat-item">
              <span className="agro-stat-label">Jumlah Titik</span>
              <span className="agro-stat-val">{stats.total_count ?? '-'}</span>
            </div>
          </div>
        ) : (
          <div className="agro-stats-box" style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', padding: '8px 0' }}>
            Belum ada data statistik
          </div>
        )}

        <button className="agro-btn-export">
          <Download size={14} />
          Export CSV
          <span className="agro-export-label">{selectedLayer?.toUpperCase()} - {period.label}</span>
        </button>
        <button className="agro-btn-export">
          <FileText size={14} />
          CSA Report
          <span className="agro-export-label">Generate PDF</span>
        </button>
      </div>
    </>
  );
};

export default PanelLeftStats;

