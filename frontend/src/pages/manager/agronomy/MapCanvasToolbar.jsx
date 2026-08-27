import { useRef, useEffect } from 'react';
import { Clock, Eye } from 'lucide-react';

const LAYER_OPTIONS = [
  { id: 'ndvi', label: 'Kesehatan Tanaman (NDVI)', permKey: 'can_access_ndvi' },
  { id: 'yield', label: 'Estimasi Produksi (Yield)', permKey: 'can_access_yield' },
  { id: 'soc', label: 'Stok Karbon (SOC)', permKey: 'can_access_soc' },
  { id: 'biomass', label: 'Biomassa Karbon', permKey: 'can_access_biomass' },
  { id: 'soilnpk', label: 'Nutrisi Tanah (NPK)', permKey: 'can_access_soilnpk' },
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
  periods = [],
}) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'SET_LAYER_OPACITY',
          opacity: opacity,
        },
        '*'
      );
    }
  }, [opacity]);

  const fallbackHtml =
    '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:Poppins,sans-serif;color:#5C7A6D;background:#f4f6f5;">Peta belum tersedia</div>';

  return (
    <div className="agro-map-column">
      {/* Loading Overlay */}
      {loading && (
        <div className="agro-loading-overlay">
          <div className="agro-loading-box">
            <div className="agro-loading-spinner" />
            Memuat data peta...
          </div>
        </div>
      )}

      {/* Baris 1: Layer Parameter Tag Pills */}
      <div className="agro-map-header-row1">
        <div className="agro-header-row-label">
          <span>Layer Parameter:</span>
        </div>
        <div className="agro-layer-pills-list">
          {LAYER_OPTIONS.map((layer) => {
            if (permissions && !permissions[layer.permKey]) return null;
            const isActive = selectedLayer === layer.id;
            return (
              <button
                key={layer.id}
                type="button"
                className={`agro-layer-pill ${isActive ? 'agro-layer-pill-active' : ''}`}
                onClick={() => onLayerChange(layer.id)}
              >
                {layer.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Baris 2: Periode Timeline Pills & Transparansi */}
      <div className="agro-map-header-row2">
        <div className="agro-period-pills-group">
          <div className="agro-header-row-label">
            <Clock size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} />
            <span>Periode:</span>
          </div>
          <div className="agro-period-pills-list">
            {periods.map((period, idx) => {
              const isActive = periodIdx === idx;
              return (
                <button
                  key={period.id}
                  type="button"
                  className={`agro-period-pill ${isActive ? 'agro-period-pill-active' : ''}`}
                  onClick={() => onPeriodChange(idx)}
                >
                  {period.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="agro-transparency-control">
          <div className="agro-transparency-label">
            <Eye size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} />
            <span>Transparansi:</span>
            <strong className="agro-transparency-val">{opacity}%</strong>
          </div>
          <input
            type="range"
            className="agro-mini-slider"
            min="0"
            max="100"
            step="5"
            value={opacity}
            onChange={(e) => onOpacityChange(parseInt(e.target.value, 10))}
            title="Transparansi Layer"
          />
        </div>
      </div>

      {/* Baris 3: Viewport Peta Bersih */}
      <div className="agro-map-viewport">
        <iframe
          ref={iframeRef}
          srcDoc={mapHtml || fallbackHtml}
          className="agro-map-frame"
          title="Peta Agronomi"
          onLoad={() => {
            if (iframeRef.current && iframeRef.current.contentWindow) {
              iframeRef.current.contentWindow.postMessage(
                {
                  type: 'SET_LAYER_OPACITY',
                  opacity: opacity,
                },
                '*'
              );
            }
          }}
        />
      </div>
    </div>
  );
};

export default MapCanvasToolbar;
