import { useEffect, useState } from 'react';
import api from '../../shared/api/axios';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TreePine, Coins, Users, Maximize2 } from 'lucide-react';
import StatCard from '../../shared/components/UI/StatCard';
import Card from '../../shared/components/UI/Card';
import { formatAreaValue, getAreaDisplay, getStoredSettings } from '../../shared/utils/settingsHelper';

const StatCardSkeleton = () => (
  <div className="stat-card" aria-busy="true" aria-label="Memuat data">
    <div className="skeleton-text mb-2" style={{ height: '14px', width: '45%' }}></div>
    <div className="skeleton-text mt-3" style={{ height: '40px', width: '70%' }}></div>
    <div className="skeleton-text mt-2" style={{ height: '24px', width: '55%', borderRadius: '6px' }}></div>
  </div>
);

const FarmMapThumbnail = ({ farmId }) => {
  const [mapHtml, setMapHtml] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.get(`/manager/farms/${farmId}/map?thumbnail=true`)
      .then(res => {
        if (isMounted && res.data?.success) setMapHtml(res.data.data.html);
        else if (isMounted) setFailed(true);
      })
      .catch(() => { if (isMounted) setFailed(true); });
    return () => { isMounted = false; };
  }, [farmId]);

  if (failed) {
    return (
      <div
        style={{ height: '180px', background: 'var(--color-surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}
        aria-label="Peta tidak tersedia"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--color-text-muted)' }}>map</span>
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Peta belum tersedia</span>
      </div>
    );
  }

  if (!mapHtml) {
    return (
      <div style={{ height: '180px', background: 'var(--color-surface-container)' }} aria-busy="true" aria-label="Memuat peta">
        <div className="skeleton-text" style={{ height: '100%', width: '100%' }}></div>
      </div>
    );
  }

  return (
    <div style={{ height: '180px', overflow: 'hidden' }}>
      <iframe
        srcDoc={mapHtml}
        style={{ width: '100%', height: '100%', pointerEvents: 'none', border: 'none', display: 'block' }}
        title="Peta Lahan"
        tabIndex={-1}
      />
    </div>
  );
};

const FarmCardSkeleton = () => (
  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
    <div className="skeleton-text" style={{ height: '180px', width: '100%' }}></div>
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="skeleton-text" style={{ height: '18px', width: '65%' }}></div>
      <div className="skeleton-text" style={{ height: '16px', width: '40%' }}></div>
      <div className="skeleton-text" style={{ height: '13px', width: '80%' }}></div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <div className="skeleton-text" style={{ height: '36px', flex: 1, borderRadius: 'var(--radius-pill)' }}></div>
        <div className="skeleton-text" style={{ height: '36px', flex: 1, borderRadius: 'var(--radius-pill)' }}></div>
      </div>
    </div>
  </div>
);

// 'YYYY-MM' -> 'Agu 2026'
const formatPeriod = (period) => {
  const [year, month] = (period || '').split('-').map(Number);
  if (!year || !month) return period || '';
  return new Date(year, month - 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
};

// Status kesehatan dari NDVI periode terakhir vs ambang batas di Settings
const FarmHealthStatus = ({ ndvi, threshold }) => {
  if (!ndvi) {
    return <span className="badge badge-neutral">Belum ada data observasi</span>;
  }
  const isStressed = ndvi.mean < threshold;
  const meanText = ndvi.mean.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <span
        className={`badge ${isStressed ? 'badge-expired' : 'badge-success'}`}
        title={`Ambang batas NDVI: ${Number(threshold).toFixed(2)}`}
      >
        {isStressed ? 'Indikasi Stres' : 'Sehat'} · NDVI {meanText}
      </span>
      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
        Observasi {formatPeriod(ndvi.period)}
      </span>
    </div>
  );
};

const FarmCard = ({ farm, ndviThreshold, onManage, onAgronomy }) => {
  // Komoditas terluas + jumlah sisanya
  const cropNames = farm.crops?.length > 0
    ? [...farm.crops].sort((a, b) => (b.area_ha || 0) - (a.area_ha || 0)).map(c => c.crop_type).filter(Boolean)
    : (farm.crop_variety || '').split(',').map(c => c.trim()).filter(Boolean);
  const cropVariety = cropNames.length > 0
    ? `${cropNames[0]}${cropNames.length > 1 ? ` +${cropNames.length - 1}` : ''}`
    : null;
  const farmersText = farm.farmers?.length > 0 ? farm.farmers.join(', ') : null;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
      <FarmMapThumbnail farmId={farm.id} />
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <h3 className="card-title" style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 700 }}>{farm.name}</h3>
          <div style={{ marginBottom: '10px' }}>
            <FarmHealthStatus ndvi={farm.ndvi_latest} threshold={ndviThreshold} />
          </div>
          <div className="agro-chip-group" style={{ marginBottom: 0 }}>
            {farm.total_area_ha > 0 && (
              <span className="agro-chip">{formatAreaValue(farm.total_area_ha)}</span>
            )}
            {cropVariety && (
              <span className="agro-chip agro-chip-active" title={cropNames.join(', ')}>{cropVariety}</span>
            )}
          </div>
        </div>

        <div style={{ fontSize: '13px' }}>
          <div style={{ fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '2px' }}>Penanggung Jawab:</div>
          <div style={{ color: 'var(--color-text-muted)' }}>
            {farmersText ?? <em style={{ opacity: 0.6 }}>Belum ditugaskan</em>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
          <button
            className="btn btn-ghost btn-sm"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => onManage(farm.id)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>settings</span>
            Kelola
          </button>
          <button
            className="btn btn-primary btn-sm"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => onAgronomy(farm.id)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>eco</span>
            Observasi
          </button>
        </div>
      </div>
    </div>
  );
};

// 85836000 -> { value: '85,8', unit: 'juta' }
const formatCompactIdr = (value) => {
  const num = Number(value);
  const scales = [[1e12, 'triliun'], [1e9, 'miliar'], [1e6, 'juta']];
  const [divisor, unit] = scales.find(([d]) => Math.abs(num) >= d) ?? [1, ''];
  return {
    value: (num / divisor).toLocaleString('id-ID', { maximumFractionDigits: divisor > 1 ? 1 : 0 }),
    unit,
  };
};

const ManagerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ndviThreshold, setNdviThreshold] = useState(() => getStoredSettings().ndviThreshold);
  const navigate = useNavigate();

  // Ikuti perubahan ambang batas NDVI dari Settings
  useEffect(() => {
    const handleUpdate = () => setNdviThreshold(getStoredSettings().ndviThreshold);
    window.addEventListener('settingsUpdated', handleUpdate);
    return () => window.removeEventListener('settingsUpdated', handleUpdate);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, farmsRes] = await Promise.allSettled([
          api.get('/manager/dashboard/stats'),
          api.get('/manager/farms'),
        ]);

        if (statsRes.status === 'fulfilled' && statsRes.value?.data?.success) {
          setStats(statsRes.value.data.data);
        } else {
          setStats(null);
        }

        if (farmsRes.status === 'fulfilled' && farmsRes.value?.data?.success) {
          setFarms(farmsRes.value.data.data);
        } else {
          setFarms([]);
        }
      } catch (err) {
        console.error('Gagal mengambil data dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleManageFarm = (id) => navigate(`/manager/farm-management?farm_id=${id}`);
  const handleAgronomy = (id) => navigate(`/manager/agronomy?farm_id=${id}`);

  // Semua nilai murni dari backend — tidak ada fallback hardcode
  const totalFarms = stats?.total_farms ?? null;
  const totalFarmers = stats?.total_farmers ?? null;
  const totalAreaHa = stats?.total_area_ha ?? null;
  const primaryCommodity = stats?.primary_commodity ?? null;
  const totalRevenue = stats?.total_revenue > 0 ? stats.total_revenue : null;
  const totalCarbonTon = stats?.total_carbon_ton > 0 ? stats.total_carbon_ton : null;
  const revenueDisplay = totalRevenue !== null ? formatCompactIdr(totalRevenue) : null;
  const areaDisplay = totalAreaHa !== null ? getAreaDisplay(totalAreaHa) : null;

  return (
    <div>
      <header className="page-header" style={{ marginBottom: 'var(--space-md)' }}>
        <div>
          <h1 className="page-title">Dashboard Manajer</h1>
          <p className="page-subtitle">Ringkasan operasional dan evaluasi kegiatan lahan kelolaan.</p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => navigate('/manager/profile')}
          aria-label="Profil perusahaan"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>apartment</span>
          Profil Perusahaan
        </button>
      </header>

      {/* METRICS 2x2 GRID */}
      <section aria-label="Metrik Utama" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="stats-grid-2x2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            <>
              {/* Kartu 1: Serapan Karbon — data dari EsgMetric.carbon_footprint; tetap tampil agar grid tidak bolong */}
              <StatCard
                title="SERAPAN KARBON"
                headerUnit="(TON CO2e)"
                value={totalCarbonTon !== null ? totalCarbonTon.toLocaleString('id-ID') : '-'}
                badgeText={totalCarbonTon !== null ? 'Biomassa Lahan Aktif' : 'Belum ada data'}
                badgeType={totalCarbonTon !== null ? 'success' : 'neutral'}
                icon={TreePine}
              />

              {/* Kartu 2: Nilai Ekonomi — data dari FinancialRecord.estimated_revenue */}
              <StatCard
                title="ESTIMASI NILAI EKONOMI (IDR)"
                value={revenueDisplay ? revenueDisplay.value : '-'}
                inlineUnit={revenueDisplay?.unit || undefined}
                subtext={totalRevenue !== null ? `Rp ${totalRevenue.toLocaleString('id-ID')}` : 'Belum ada data keuangan'}
                icon={Coins}
                silhouetteColor="var(--color-dark-amber)"
              />

              {/* Kartu 3: Lahan & Petani — data dari Farm.count + Farmer.count */}
              <StatCard
                title="LAHAN & PETANI"
                value={totalFarms !== null ? totalFarms : '-'}
                inlineUnit="Lahan Terdaftar"
                badgeText={totalFarmers !== null ? `${totalFarmers} Petani Terdaftar` : null}
                badgeType="success"
                icon={Users}
              />

              {/* Kartu 4: Luas Lahan & Komoditas — data dari Farm.total_area_ha + Farm.crop_variety */}
              <StatCard
                title="TOTAL LUAS LAHAN"
                headerUnit={`(${areaDisplay ? areaDisplay.unit.toUpperCase() : 'HA'})`}
                value={areaDisplay ? areaDisplay.value : '-'}
                badgeText={primaryCommodity ? `Komoditas: ${primaryCommodity}` : null}
                badgeType="success"
                icon={Maximize2}
              />
            </>
          )}
        </div>
      </section>

      {/* DAFTAR LAHAN PROYEK */}
      <section aria-label="Daftar Lahan Proyek">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-main)', margin: '0 0 2px 0' }}>
              Daftar Lahan Proyek
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
              {farms.length > 0 ? `${farms.length} lahan dalam pengelolaan` : 'Belum ada lahan terdaftar'}
            </p>
          </div>
          {farms.length > 0 && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => navigate('/manager/farm-management')}
            >
              Lihat Semua
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            <FarmCardSkeleton />
            <FarmCardSkeleton />
            <FarmCardSkeleton />
          </div>
        ) : farms.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {farms.map(farm => (
              <FarmCard
                key={farm.id}
                farm={farm}
                ndviThreshold={ndviThreshold}
                onManage={handleManageFarm}
                onAgronomy={handleAgronomy}
              />
            ))}
          </div>
        ) : (
          <Card>
            <div role="status" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'var(--color-text-muted)', display: 'block', marginBottom: '12px' }}>landscape</span>
              <p style={{ fontWeight: 600, color: 'var(--color-text-main)', margin: '0 0 4px 0' }}>Belum ada lahan terdaftar</p>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>Lahan yang Anda kelola akan muncul di sini.</p>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
};

export default ManagerDashboard;
