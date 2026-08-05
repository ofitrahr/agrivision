import { MapPin, Leaf, Calendar, Mountain, TreePine, Activity, ArrowRight, Users, Map as MapIcon } from 'lucide-react';
import { formatAreaValue } from '../../../shared/utils/settingsHelper';

const FarmSelectorView = ({
  farms = [],
  selectedFarm = null,
  onSelectFarm,
  onViewDetail,
  loading = false,
  mapLoading = false,
  selectorMapHtml = '',
}) => {
  const farmersList = selectedFarm?.farmers && selectedFarm.farmers.length > 0
    ? selectedFarm.farmers.join(', ')
    : 'Belum ada petani terdaftar';

  const farmRows = selectedFarm ? [
    { icon: MapPin,   label: 'Nama Lahan',          value: selectedFarm.name },
    { icon: MapIcon,  label: 'Luas',                value: formatAreaValue(selectedFarm.total_area_ha) },
    { icon: Leaf,     label: 'Komoditas',            value: selectedFarm.crop_type || selectedFarm.crop_variety || '-' },
    { icon: Calendar, label: 'Tahun Berdiri',        value: selectedFarm.established_year || '-' },
    { icon: Mountain, label: 'Elevasi',              value: selectedFarm.altitude ? (selectedFarm.altitude.includes('mdpl') ? selectedFarm.altitude : `${selectedFarm.altitude} mdpl`) : '-' },
    { icon: TreePine, label: 'Sistem Agroforestri',  value: selectedFarm.agroforestry_system || 'Agroforestri Organik' },
    { icon: Users,    label: 'Petani Pengelola',     value: farmersList },
  ] : [];

  return (
    <div className="agro-selector-grid">
      {/* Left Card - Farm Overview */}
      <div className="agro-card">
        <h2 className="agro-card-title">
          <Activity size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
          Ringkasan Lahan
        </h2>
        <p className="agro-card-subtitle">
          Pilih kebun dan lihat ringkasan efisiensi dan potensi proyek.
        </p>

        {loading ? (
          <div className="agro-empty-state">Memuat data...</div>
        ) : selectedFarm ? (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {/* Chips */}
            <div className="agro-chip-group">
              <span className="agro-chip">{selectedFarm.total_area_ha} Ha</span>
              {(selectedFarm.crop_type || selectedFarm.crop_variety) && (
                <span className="agro-chip">{selectedFarm.crop_type || selectedFarm.crop_variety}</span>
              )}
            </div>

            {/* Summary */}
            {selectedFarm.summary && (
              <p className="agro-farm-summary">{selectedFarm.summary}</p>
            )}

            {/* Detail Table */}
            <div className="agro-farm-table">
              {farmRows.map(({ icon: Icon, label, value }) => (
                <div key={label} className="agro-farm-row">
                  <span className="agro-farm-label">
                    <Icon size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                    {label}
                  </span>
                  <span className="agro-farm-value">{value || '-'}</span>
                </div>
              ))}
            </div>

            {/* Action Button */}
            <button
              className="agro-btn-detail"
              onClick={() => onViewDetail?.(selectedFarm)}
            >
              Lihat Dasbor Agronomi Detail
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div className="agro-empty-state">
            <Leaf size={48} style={{ margin: '0 auto 16px', opacity: 0.3, display: 'block' }} />
            Pilih lahan pada peta atau daftar untuk melihat detail
          </div>
        )}
      </div>

      {/* Right Card - Select Project & Map */}
      <div className="agro-card">
        <h2 className="agro-card-title">
          <MapPin size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
          Pilih Proyek
        </h2>
        <p className="agro-card-subtitle">
          Gunakan peta interaktif untuk memilih lokasi dan memulai analisis proyek.
        </p>

        {/* Map Area */}
        <div className="agro-map-placeholder">
          {mapLoading ? (
            <div className="agro-map-placeholder-text">
              <div className="agro-loading-spinner" style={{ margin: '0 auto 12px' }} />
              <p>Memuat peta lahan...</p>
            </div>
          ) : selectorMapHtml ? (
            <iframe
              srcDoc={selectorMapHtml}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Peta Lahan"
            />
          ) : selectedFarm ? (
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=107.50%2C-7.15%2C107.65%2C-7.05&amp;layer=mapnik"
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Peta OpenStreetMap"
            />
          ) : (
            <div className="agro-map-placeholder-text">
              <MapIcon size={48} style={{ margin: '0 auto 16px', opacity: 0.5, display: 'block' }} />
              <p>Pilih lahan untuk melihat lokasi</p>
            </div>
          )}
        </div>

        {/* Projects List */}
        <h3 className="agro-projects-title">Daftar Lahan Tersedia</h3>

        {loading ? (
          <p className="agro-empty-state">Memuat daftar lahan...</p>
        ) : farms.length === 0 ? (
          <p className="agro-empty-state">Tidak ada lahan yang tersedia.</p>
        ) : (
          <div className="agro-project-list">
            {farms.map((farm) => {
              const isSelected = selectedFarm?.id === farm.id;
              return (
                <div
                  key={farm.id}
                  className={`agro-project-item ${isSelected ? 'active' : ''}`}
                  onClick={() => onSelectFarm?.(farm)}
                >
                  <div className="agro-project-header">
                    <span className="agro-project-name">{farm.name}</span>
                  </div>
                  <div className="agro-project-info">
                    <span>
                      <MapIcon size={14} />
                      {farm.total_area_ha} Ha
                    </span>
                    {(farm.crop_type || farm.crop_variety) && (
                      <span>
                        <Leaf size={14} />
                        {farm.crop_type || farm.crop_variety}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmSelectorView;
