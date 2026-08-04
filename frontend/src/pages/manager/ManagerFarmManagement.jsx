import { useEffect, useState, useCallback } from 'react';
import api from '../../shared/api/axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Settings, Leaf, MapPin, Plus, X, Save, Users, Calendar, Mountain, TreePine, Activity } from 'lucide-react';

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
  const [crops, setCrops] = useState([]);
  const [newCropInput, setNewCropInput] = useState('');

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
        setTotalAreaHa(d.total_area_ha || '');
        setCropVariety(d.crop_variety || '');
        setAltitude(d.altitude || '');
        setEstablishedYear(d.established_year || '');
        setAgroforestrySystem(d.agroforestry_system || 'Agroforestri Organik');
        setSelectedFarmerIds(d.farmers ? d.farmers.map(f => f.id) : []);
        setCrops(d.crops || []);
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

  const handleAddCrop = (e) => {
    e.preventDefault();
    const trimmed = newCropInput.trim();
    if (trimmed && !crops.includes(trimmed)) {
      setCrops([...crops, trimmed]);
    }
    setNewCropInput('');
  };

  const handleRemoveCrop = (cropToRemove) => {
    setCrops(crops.filter(c => c !== cropToRemove));
  };

  const toggleFarmer = (farmerId) => {
    if (selectedFarmerIds.includes(farmerId)) {
      setSelectedFarmerIds(selectedFarmerIds.filter(id => id !== farmerId));
    } else {
      setSelectedFarmerIds([...selectedFarmerIds, farmerId]);
    }
  };

  const handleSave = async () => {
    if (!farmName.trim()) {
      alert('Nama lahan tidak boleh kosong.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put(`/manager/farms/${selectedFarmId}/details`, {
        name: farmName,
        total_area_ha: parseFloat(totalAreaHa) || 0,
        crop_variety: cropVariety,
        altitude: altitude,
        agroforestry_system: agroforestrySystem,
        farmer_ids: selectedFarmerIds,
        crop_types: crops
      });
      if (res.data.success) {
        alert('Berhasil menyimpan semua perubahan lahan!');
        handleBackToList();
      }
    } catch (err) {
      console.error('Gagal menyimpan perubahan:', err);
      alert('Gagal menyimpan perubahan data lahan.');
    } finally {
      setSaving(false);
    }
  };

  // LIST VIEW (Daftar Lahan Perusahaan)
  if (viewMode === 'list') {
    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--color-text-main)', margin: '0 0 6px 0' }}>
            Daftar Lahan Project
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
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
              const tanamanText = f.crops && f.crops.length > 0 ? f.crops.join(', ') : (f.crop_variety || '-');
              const farmersText = f.farmers && f.farmers.length > 0 ? f.farmers.join(', ') : '-';
              return (
                <div key={f.id} className="agro-card" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
                  <FarmMapThumbnail farmId={f.id} />

                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--color-text-main)', margin: '0 0 8px 0' }}>
                    {f.name}
                  </h3>

                  <div className="agro-chip-group" style={{ marginBottom: '16px' }}>
                    <span className="agro-chip">{f.total_area_ha} Ha</span>
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
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--color-text-main)', margin: '0 0 6px 0' }}>
          Kelola Lahan: {farmName || '...'}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
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
                <input
                  type="number"
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
            <p className="agro-card-subtitle" style={{ marginBottom: '20px' }}>
              Pilih petani pengelola yang bertanggung jawab atas lahan ini.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
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
                        padding: '12px 14px',
                        border: `1px solid ${isChecked ? 'var(--color-main-green)' : 'var(--color-border-muted)'}`,
                        borderRadius: '10px',
                        cursor: 'pointer',
                        background: isChecked ? '#e6f4eb' : 'var(--color-surface-white)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleFarmer(farmer.id)}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--color-main-green)' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-main)' }}>{farmer.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{farmer.phone || 'Tidak ada no telepon'}</div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Section 3: Jenis Tanaman (Komoditas) */}
          <div className="agro-card">
            <h2 className="agro-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
              <Leaf size={18} />
              Jenis Tanaman (Komoditas)
            </h2>
            <p className="agro-card-subtitle" style={{ marginBottom: '20px' }}>
              Tambahkan komoditas tanaman yang dibudidayakan di lahan ini.
            </p>

            <form onSubmit={handleAddCrop} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input
                type="text"
                className="form-input"
                value={newCropInput}
                onChange={(e) => setNewCropInput(e.target.value)}
                placeholder="Cth: Kopi Arabika, Jagung"
                style={{ flex: 1 }}
              />
              <button type="submit" className="agro-btn-export" style={{ width: 'auto', padding: '8px 16px', background: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary)' }}>
                <Plus size={16} />
                Tambah
              </button>
            </form>

            <div className="agro-chip-group">
              {crops.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Belum ada tanaman yang ditambahkan.</p>
              ) : (
                crops.map((crop, idx) => (
                  <span key={idx} className="agro-chip agro-chip-active" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '13px' }}>
                    {crop}
                    <button
                      type="button"
                      onClick={() => handleRemoveCrop(crop)}
                      style={{ background: 'none', border: 'none', color: '#12513c', cursor: 'pointer', padding: 0, display: 'flex' }}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save Action Bar */}
      {!loading && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--color-border-muted)' }}>
          <button className="agro-btn-export" style={{ width: 'auto', padding: '12px 24px' }} onClick={handleBackToList}>
            Batal
          </button>
          <button className="agro-btn-detail" style={{ width: 'auto', padding: '12px 32px' }} onClick={handleSave} disabled={saving}>
            <Save size={18} />
            {saving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ManagerFarmManagement;
