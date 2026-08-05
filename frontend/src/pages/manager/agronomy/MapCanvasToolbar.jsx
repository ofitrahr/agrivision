import { Layers, Clock, Eye } from 'lucide-react';

const PERIODS = [
  { id: 'Q1_2025', label: 'Jan - Mar 2025' },
  { id: 'Q2_2025', label: 'Apr - Jun 2025' },
  { id: 'Q3_2025', label: 'Jul - Sep 2025' },
  { id: 'Q4_2025', label: 'Okt - Des 2025' },
  { id: 'Q1_2026', label: 'Jan - Mar 2026' },
];

const MapCanvasToolbar = ({
  mapHtml,
  selectedLayer,
  onLayerChange,
  periodIdx,
  onPeriodChange,
  opacity,
  onOpacityChange,
  permissions,
  loading,
}) => {
  const fallbackHtml =
    '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:Poppins,sans-serif;color:#5C7A6D;background:#f4f6f5;">Peta belum tersedia</div>';

  return (
    <>
      {/* Loading Overlay */}
      {loading && (
        <div className="agro-loading-overlay">
          <div className="agro-loading-box">
            <div className="agro-loading-spinner" />
            Memuat data peta...
          </div>
        </div>
      )}

      {/* Map iframe */}
      <iframe
        srcDoc={mapHtml || fallbackHtml}
        className="agro-map-frame"
        title="Peta Agronomi"
      />

      {/* Floating Toolbar */}
      <div className="agro-map-toolbar">
        {/* Layer Parameter */}
        <div className="agro-toolbar-group">
          <label className="agro-toolbar-label">
            <Layers size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} />
            Layer Parameter
          </label>
          <select
            className="agro-toolbar-select"
            value={selectedLayer}
            onChange={(e) => onLayerChange(e.target.value)}
          >
            {(!permissions || permissions.can_access_ndvi) && (
              <option value="ndvi">Kesehatan Tanaman (NDVI)</option>
            )}
            {(!permissions || permissions.can_access_yield) && (
              <option value="yield">Estimasi Produksi (Yield)</option>
            )}
            {(!permissions || permissions.can_access_soc) && (
              <option value="soc">Stok Karbon (SOC)</option>
            )}
            {(!permissions || permissions.can_access_biomass) && (
              <option value="biomass">Biomassa Karbon</option>
            )}
            {(!permissions || permissions.can_access_soilnpk) && (
              <option value="soilnpk">Nutrisi Tanah (NPK)</option>
            )}
          </select>
        </div>

        <div className="agro-toolbar-divider" />

        {/* Periode */}
        <div className="agro-toolbar-group">
          <label className="agro-toolbar-label">
            <Clock size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} />
            Periode
          </label>
          <input
            type="range"
            className="agro-toolbar-slider"
            min="0"
            max={PERIODS.length - 1}
            step="1"
            value={periodIdx}
            onChange={(e) => onPeriodChange(parseInt(e.target.value, 10))}
          />
          <div className="agro-toolbar-time-label">
            {PERIODS[periodIdx]?.label || '-'}
          </div>
        </div>

        <div className="agro-toolbar-divider" />

        {/* Transparansi */}
        <div className="agro-toolbar-group">
          <label className="agro-toolbar-label">
            <Eye size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} />
            Transparansi Layer
          </label>
          <input
            type="range"
            className="agro-toolbar-slider"
            min="0"
            max="100"
            step="5"
            value={opacity}
            onChange={(e) => onOpacityChange(parseInt(e.target.value, 10))}
          />
          <div className="agro-toolbar-opacity-label">
            <span>Transparan</span>
            <span>{opacity}%</span>
            <span>Solid</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default MapCanvasToolbar;
