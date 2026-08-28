import { useEffect, useState, useCallback } from 'react';
import api from '../../shared/api/axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Settings, Leaf, MapPin, Plus, X, Save, Users, Calendar, Mountain, TreePine, Activity, AlertCircle, Trash2, CheckCircle2, Circle } from 'lucide-react';
import InputNumber from '../../shared/components/UI/InputNumber';


const FarmMapThumbnail = ({ farmId }) => {
  const [mapHtml, setMapHtml] = useState('');

  useEffect(() => {
    let isMounted = true;
    api.get(`/manager/farms/${farmId}/map?thumbnail=true`)
      .then(res => {
        if (isMounted && res.data.success) setMapHtml(res.data.data.html);
      })
      .catch(err => console.error(err));
    return () => { isMounted = false; };
  }, [farmId]);

  if (!mapHtml) {
    return (
      <div className="agro-map-placeholder" style={{ height: '180px', marginBottom: '16px', borderRadius: '12px' }}>
        <div className="agro-map-placeholder-text">
          <MapPin size={32} style={{ margin: '0 auto 8px', opacity: 0.4, display: 'block' }} />
          <span>Memuat peta lahan...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '180px', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', border: '1px solid var(--color-border-muted)' }}>
      <iframe
        srcDoc={mapHtml}
        style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
        title="Peta Lahan"
        tabIndex={-1}
      />
    </div>
  );
};

const ManagerFarmManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'edit'
  const [farmList, setFarmList] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(null);
  const [allFarmers, setAllFarmers] = useState([]);

  // Edit Form State
  const [farmName, setFarmName] = useState('');
  const [totalAreaHa, setTotalAreaHa] = useState('');
  const [cropVariety, setCropVariety] = useState('');
  const [altitude, setAltitude] = useState('');
  const [establishedYear, setEstablishedYear] = useState('');
  const [agroforestrySystem, setAgroforestrySystem] = useState('');
  const [selectedFarmerIds, setSelectedFarmerIds] = useState([]);
  const [crops, setCrops] = useState([]); // [{ id?, crop_type: string, area_ha: number | string }]

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const initFarms = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const farmsRes = await api.get('/manager/farms');
      if (farmsRes.data.success) {
        const farmsData = farmsRes.data.data;
        setFarmList(farmsData);

        const params = new URLSearchParams(location.search);
        const qFarmId = params.get('farm_id');
        if (qFarmId && farmsData.some(f => String(f.id) === String(qFarmId))) {
          setSelectedFarmId(qFarmId);
          setViewMode('edit');
          fetchFarmDetails(qFarmId);
        }
      }
    } catch (error) {
      console.error('Gagal memuat data lahan:', error);
      setErrorMsg('Gagal memuat daftar lahan.');
    } finally {
      setLoading(false);
    }
  }, [location.search]);

  useEffect(() => {
    initFarms();
  }, [initFarms]);

  const fetchFarmDetails = async (id) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [farmRes, farmersRes] = await Promise.all([
        api.get(`/manager/farms/${id}/details`),
        api.get('/manager/farmers')
      ]);

      if (farmRes.data.success) {
        const d = farmRes.data.data;
        setFarmName(d.name || '');
        setTotalAreaHa(d.total_area_ha !== undefined && d.total_area_ha !== null ? d.total_area_ha : '');
        setCropVariety(d.crop_variety || '');
        setAltitude(d.altitude || '');
        setEstablishedYear(d.established_year || '');
        setAgroforestrySystem(d.agroforestry_system || 'Agroforestri Organik');
        setSelectedFarmerIds(d.farmers ? d.farmers.map(f => f.id) : []);
        setCrops(
          (d.crops || []).map(c =>
            typeof c === 'string'
              ? { crop_type: c, area_ha: '' }
              : { id: c.id, crop_type: c.crop_type, area_ha: c.area_ha ?? '' }
          )
        );
      }
      if (farmersRes.data.success) {
        setAllFarmers(farmersRes.data.data);
      }
    } catch (error) {
      console.error('Gagal memuat detail lahan:', error);
      setErrorMsg('Gagal memuat detail lahan.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (farm) => {
    setSelectedFarmId(farm.id);
    setViewMode('edit');
    fetchFarmDetails(farm.id);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedFarmId(null);
    initFarms();
  };

  const handleAddNewCropRow = () => {
    setCrops([...crops, { crop_type: '', area_ha: '' }]);
  };

  const handleUpdateCrop = (index, field, value) => {
    const updated = [...crops];
    updated[index] = { ...updated[index], [field]: value };
    setCrops(updated);
  };

  const handleRemoveCrop = (index) => {
    setCrops(crops.filter((_, idx) => idx !== index));
  };

  const toggleFarmer = (farmerId) => {
    if (selectedFarmerIds.includes(farmerId)) {
      setSelectedFarmerIds(selectedFarmerIds.filter(id => id !== farmerId));
    } else {
      setSelectedFarmerIds([...selectedFarmerIds, farmerId]);
    }
  };

  const parsedTotalFarmArea = parseFloat(totalAreaHa) || 0;
  const totalAllocatedCropArea = crops.reduce((sum, c) => sum + (parseFloat(c.area_ha) || 0), 0);
  const remainingFarmArea = parsedTotalFarmArea - totalAllocatedCropArea;
  const allocationPercent = parsedTotalFarmArea > 0
    ? Math.min(100, Math.round((totalAllocatedCropArea / parsedTotalFarmArea) * 100))
    : 0;
  const isOverAllocated = parsedTotalFarmArea > 0 && totalAllocatedCropArea > parsedTotalFarmArea + 0.0001;

  const handleSave = async () => {
    if (!farmName.trim()) {
      alert('Nama lahan tidak boleh kosong.');
      return;
    }
    if (isOverAllocated) {
      alert(`Total alokasi luasan komoditas (${totalAllocatedCropArea.toFixed(2)} Ha) melebihi total luas lahan (${parsedTotalFarmArea.toFixed(2)} Ha). Harap sesuaikan luas komoditas.`);
      return;
    }

    setSaving(true);
    try {
      const payloadCrops = crops
        .filter(c => c.crop_type && c.crop_type.trim())
        .map(c => ({
          crop_type: c.crop_type.trim(),
          area_ha: parseFloat(c.area_ha) || 0
        }));

      const res = await api.put(`/manager/farms/${selectedFarmId}/details`, {
        name: farmName,
        total_area_ha: parsedTotalFarmArea,
        crop_variety: cropVariety,
        altitude: altitude,
        agroforestry_system: agroforestrySystem,
        farmer_ids: selectedFarmerIds,
        crops: payloadCrops
      });
      if (res.data.success) {
        alert('Berhasil menyimpan semua perubahan lahan!');
        handleBackToList();
      }
    } catch (err) {
      console.error('Gagal menyimpan perubahan:', err);
      const msg = err.response?.data?.message || 'Gagal menyimpan perubahan data lahan.';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  // LIST VIEW (Daftar Lahan Perusahaan)
  if (viewMode === 'list') {
    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <h1 className="page-title">Daftar Lahan Project</h1>
          <p className="page-subtitle">
            Kelola data lahan, ringkasan spesifikasi, penugasan petani, dan komoditas tanaman.
          </p>
        </div>

        {errorMsg && (
          <div className="agro-error">{errorMsg}</div>
        )}

        {loading ? (
          <div className="agro-empty-state">Memuat daftar lahan...</div>
        ) : farmList.length === 0 ? (
          <div className="agro-empty-state">Belum ada lahan yang terdaftar di proyek ini.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {farmList.map((f) => {
              const tanamanText = f.crops && f.crops.length > 0
                ? f.crops.map(c => typeof c === 'object' && c.crop_type ? `${c.crop_type}${c.area_ha && parseFloat(c.area_ha) > 0 ? ` (${parseFloat(c.area_ha)} Ha)` : ''}` : c).join(', ')
                : (f.crop_variety || '-');
              const farmersText = f.farmers && f.farmers.length > 0 ? f.farmers.join(', ') : '-';
              const firstCropTitle = f.crops && f.crops.length > 0
                ? (typeof f.crops[0] === 'object' ? `${f.crops[0].crop_type}${f.crops.length > 1 ? ` (+${f.crops.length - 1})` : ''}` : f.crops[0])
                : f.crop_variety;

              return (
                <div key={f.id} className="agro-card" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
                  <FarmMapThumbnail farmId={f.id} />

                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--color-text-main)', margin: '0 0 8px 0' }}>
                    {f.name}
                  </h3>

                  <div className="agro-chip-group" style={{ marginBottom: '16px' }}>
                    <span className="agro-chip">{f.total_area_ha} Ha</span>

                    {firstCropTitle && (
                      <span
                        className="agro-chip agro-chip-active"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Leaf size={12} />
                        {firstCropTitle}
                      </span>
                    )}

                    {f.agroforestry_system && (
                      <span
                        className="agro-chip"
                        style={{
                          background: '#f0f5f2',
                          color: 'var(--color-forest-green)',
                          border: '1px solid var(--color-border-muted)',
                        }}
                      >
                        {f.agroforestry_system}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', marginBottom: '20px', flex: 1 }}>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--color-text-main)', display: 'block', marginBottom: '2px' }}>Tanaman:</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>{tanamanText}</span>
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--color-text-main)', display: 'block', marginBottom: '2px' }}>Penanggung Jawab:</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>{farmersText}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                    <button
                      className="agro-btn-export"
                      style={{ flex: 1, justifyContent: 'center', padding: '10px 14px' }}
                      onClick={() => handleOpenEdit(f)}
                    >
                      <Settings size={16} />
                      Kelola
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // EDIT VIEW (Edit Ringkasan Lahan, Penugasan Petani, Jenis Tanaman)
  const currentFarmObject = farmList.find(f => f.id === selectedFarmId);

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <div className="agro-breadcrumb" style={{ marginBottom: '20px' }}>
        <button className="agro-breadcrumb-link" onClick={handleBackToList}>
          <ArrowLeft size={16} />
          <span>Manajemen Lahan</span>
        </button>
        <span className="agro-breadcrumb-separator">/</span>
        <span className="agro-breadcrumb-current">Kelola {farmName || 'Lahan'}</span>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">
          Kelola Lahan: {farmName || '...'}
        </h1>
        <p className="page-subtitle">
          Ubah informasi ringkasan lahan, atur penugasan petani pengelola, dan kelola jenis komoditas tanaman.
        </p>
      </div>

      {errorMsg && (
        <div className="agro-error">{errorMsg}</div>
      )}

      {loading ? (
        <div className="agro-empty-state">Memuat detail lahan...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          
          {/* Section 1: Edit Ringkasan Lahan */}
          <div className="agro-card">
            <h2 className="agro-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
              <Activity size={18} />
              Edit Ringkasan Lahan
            </h2>
            <p className="agro-card-subtitle" style={{ marginBottom: '20px' }}>
              Perbarui atribut utama spesifikasi lahan yang akan ditampilkan pada Ringkasan Lahan.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-main)', marginBottom: '6px', display: 'block' }}>
                  Nama Lahan
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="Cth: Kebon Kopi Kadatuan"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-main)', marginBottom: '6px', display: 'block' }}>
                  Luas Lahan (Hektar)
                </label>
                <InputNumber
                  min="0.1"
                  step="0.1"
                  className="form-input"
                  value={totalAreaHa}
                  onChange={(e) => setTotalAreaHa(e.target.value)}
                  placeholder="Cth: 25"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-main)', marginBottom: '6px', display: 'block' }}>
                  Varietas / Komoditas Utama
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={cropVariety}
                  onChange={(e) => setCropVariety(e.target.value)}
                  placeholder="Cth: Kopi Arabika"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-main)', marginBottom: '6px', display: 'block' }}>
                  Elevasi (mdpl)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={altitude}
                  onChange={(e) => setAltitude(e.target.value)}
                  placeholder="Cth: 1,300 – 1,500 mdpl"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-main)', marginBottom: '6px', display: 'block' }}>
                  Sistem Agroforestri
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={agroforestrySystem}
                  onChange={(e) => setAgroforestrySystem(e.target.value)}
                  placeholder="Cth: Organic Agroforestry"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Penugasan Petani */}
          <div className="agro-card">
            <h2 className="agro-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
              <Users size={18} />
              Penugasan Petani
            </h2>
            <p className="agro-card-subtitle" style={{ marginBottom: '16px' }}>
              Pilih petani pengelola yang bertanggung jawab atas lahan ini.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '360px', overflowY: 'auto' }}>
              {allFarmers.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Belum ada data petani terdaftar di perusahaan ini.</p>
              ) : (
                allFarmers.map(farmer => {
                  const isChecked = selectedFarmerIds.includes(farmer.id);
                  return (
                    <label
                      key={farmer.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 10px 10px 12px',
                        borderRadius: '0 6px 6px 0',
                        cursor: 'pointer',
                        background: isChecked ? '#f8fafc' : 'transparent',
                        borderLeft: isChecked ? '3px solid var(--color-main-green)' : '3px solid transparent',
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isChecked ? (
                          <CheckCircle2 size={19} color="var(--color-main-green)" />
                        ) : (
                          <Circle size={19} color="#cbd5e1" />
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleFarmer(farmer.id)}
                        style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: isChecked ? 600 : 400, color: 'var(--color-text-main)' }}>
                        {farmer.name}
                      </span>
                      {farmer.phone && (
                        <span style={{ fontSize: '12px', color: isChecked ? 'var(--color-text-main)' : 'var(--color-text-muted)', marginLeft: 'auto', fontWeight: isChecked ? 500 : 400 }}>
                          {farmer.phone}
                        </span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Section 3: Jenis Tanaman & Alokasi Luas Komoditas */}
          <div className="agro-card">
            <h2 className="agro-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
              <Leaf size={18} />
              Jenis Tanaman & Luas Komoditas
            </h2>
            <p className="agro-card-subtitle" style={{ marginBottom: '14px' }}>
              Tentukan jenis tanaman dan luas masing-masing di lahan ini.
            </p>

            {/* Ringkasan Status Luas (Tanpa Bar) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px', fontSize: '13px' }}>
              <span style={{ color: 'var(--color-text-main)' }}>
                Total terpakai: <strong style={{ color: isOverAllocated ? '#dc2626' : 'var(--color-text-main)' }}>{totalAllocatedCropArea.toFixed(2)} Ha</strong> dari <strong>{parsedTotalFarmArea.toFixed(2)} Ha</strong>
              </span>
              <span style={{ fontWeight: 600, color: isOverAllocated ? '#dc2626' : 'var(--color-text-muted)' }}>
                {isOverAllocated
                  ? `Kelebihan ${(totalAllocatedCropArea - parsedTotalFarmArea).toFixed(2)} Ha!`
                  : `Sisa Luas: ${Math.max(0, remainingFarmArea).toFixed(2)} Ha`}
              </span>
            </div>

            {isOverAllocated && (
              <div style={{
                marginBottom: '14px',
                padding: '8px 12px',
                background: '#fee2e2',
                borderRadius: '6px',
                color: '#991b1b',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span>Total luas tanaman melebihi total luas lahan ({parsedTotalFarmArea} Ha). Harap kurangi luas tanaman.</span>
              </div>
            )}

            {/* Daftar Baris Tanaman Langsung */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
              {crops.length === 0 ? (
                <div style={{
                  padding: '20px 16px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  border: '1px solid var(--color-border-muted)',
                  borderRadius: '8px',
                  color: 'var(--color-text-muted)',
                  fontSize: '13px'
                }}>
                  Belum ada data tanaman. Klik tombol <strong>Tambah Tanaman</strong> di bawah untuk menambahkan.
                </div>
              ) : (
                crops.map((crop, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      background: '#ffffff',
                      border: '1px solid var(--color-border-muted)',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ flex: 2 }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ width: '100%', padding: '8px 12px', fontSize: '14px' }}
                        value={crop.crop_type}
                        onChange={(e) => handleUpdateCrop(idx, 'crop_type', e.target.value)}
                        placeholder="Nama tanaman (misal: Kopi Arabika)"
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: '110px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <InputNumber
                        className="form-input"
                        style={{ width: '100%', padding: '8px 12px', fontSize: '14px' }}
                        value={crop.area_ha}
                        onChange={(e) => handleUpdateCrop(idx, 'area_ha', e.target.value)}
                        placeholder="0.0"
                        step="0.01"
                        min="0"
                      />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)', flexShrink: 0 }}>Ha</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveCrop(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'none',
                        border: 'none',
                        color: '#dc2626',
                        cursor: 'pointer',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        flexShrink: 0
                      }}
                      title="Hapus tanaman"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Tombol Tambah Baris Tanaman Baru */}
            <button
              type="button"
              className="agro-btn-export"
              style={{
                width: 'auto',
                padding: '9px 18px',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
              onClick={handleAddNewCropRow}
            >
              <Plus size={16} />
              Tambah Tanaman
            </button>
          </div>

        </div>
      )}

      {/* Save Action Bar */}
      {!loading && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--color-border-muted)' }}>
          <button className="agro-btn-export" style={{ width: 'auto', padding: '12px 24px' }} onClick={handleBackToList}>
            Batal
          </button>
          <button
            className="agro-btn-detail"
            style={{
              width: 'auto',
              padding: '12px 32px',
              opacity: isOverAllocated ? 0.6 : 1,
              cursor: isOverAllocated ? 'not-allowed' : 'pointer'
            }}
            onClick={handleSave}
            disabled={saving || isOverAllocated}
          >
            <Save size={18} />
            {saving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ManagerFarmManagement;
