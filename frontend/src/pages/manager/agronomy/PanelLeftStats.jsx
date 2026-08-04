import { useState } from 'react';
import { AlertTriangle, Download, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const MOCK_HISTOGRAM = [
  { bin: '28.0', count: 5 },
  { bin: '30.8', count: 12 },
  { bin: '33.6', count: 28 },
  { bin: '36.4', count: 45 },
  { bin: '39.2', count: 62 },
  { bin: '42.0', count: 85 },
  { bin: '44.8', count: 72 },
  { bin: '47.6', count: 48 },
  { bin: '50.4', count: 22 },
  { bin: '53.2', count: 8 },
];

const MOCK_STATS = { mean: '42.156', min: '28.340', max: '55.120', std: '6.842' };

const PanelLeftStats = ({ selectedLayer, periodIdx, farm }) => {
  const [showOnMap, setShowOnMap] = useState(true);
  const hasAnomaly = true;
  const anomalyPercent = 10;

  return (
    <>
      {/* Distribusi Data Piksel */}
      <div className="agro-panel-section">
        <div className="agro-panel-label">Distribusi Data Piksel</div>
        <p className="agro-panel-desc">
          Menampilkan distribusi nilai {selectedLayer?.toUpperCase() || 'DATA'} pada area yang dipilih.
        </p>
        <div className="agro-chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MOCK_HISTOGRAM} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
        </div>
        <div className="agro-hist-hint">Klik area pada peta untuk detail nilai</div>
      </div>

      <div className="agro-panel-divider" />

      {/* Peringatan Anomali */}
      {hasAnomaly && (
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
                <span className="agro-anomaly-count">2.50 Ha</span>
                <span className="agro-anomaly-total">/ 25 Ha</span>
                <span className="agro-anomaly-percent">({anomalyPercent}%)</span>
              </div>
              <div className="agro-anomaly-desc">Karbon tanah kritis (&lt; 32 Ton C/Ha)</div>
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
        <div className="agro-stats-box">
          <div className="agro-stat-item">
            <span className="agro-stat-label">Mean</span>
            <span className="agro-stat-val">{MOCK_STATS.mean}</span>
          </div>
          <div className="agro-stat-item">
            <span className="agro-stat-label">Min</span>
            <span className="agro-stat-val">{MOCK_STATS.min}</span>
          </div>
          <div className="agro-stat-item">
            <span className="agro-stat-label">Max</span>
            <span className="agro-stat-val">{MOCK_STATS.max}</span>
          </div>
          <div className="agro-stat-item">
            <span className="agro-stat-label">Std Dev</span>
            <span className="agro-stat-val">{MOCK_STATS.std}</span>
          </div>
        </div>

        <button className="agro-btn-export">
          <Download size={14} />
          Export CSV
          <span className="agro-export-label">SOC - Jan-Mar 2026</span>
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
