import { useEffect, useState } from 'react';
import api from '../../shared/api/axios';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import StatCard from '../../shared/components/UI/StatCard';
import Card from '../../shared/components/UI/Card';

const StatCardSkeleton = () => (
  <div className="stat-card" aria-busy="true" aria-label="Memuat data">
    <div className="skeleton-text mb-2" style={{ height: '12px', width: '45%' }}></div>
    <div className="skeleton-text mt-3" style={{ height: '36px', width: '70%' }}></div>
    <div className="skeleton-text mt-2" style={{ height: '20px', width: '55%', borderRadius: '6px' }}></div>
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
      <div className="skeleton-text" style={{ height: '20px', width: '65%' }}></div>
      <div className="skeleton-text" style={{ height: '16px', width: '40%' }}></div>
      <div className="skeleton-text" style={{ height: '14px', width: '80%' }}></div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <div className="skeleton-text" style={{ height: '36px', flex: 1, borderRadius: 'var(--radius-pill)' }}></div>
        <div className="skeleton-text" style={{ height: '36px', flex: 1, borderRadius: 'var(--radius-pill)' }}></div>
      </div>
    </div>
  </div>
);

const FarmCard = ({ farm, onManage, onAgronomy }) => {
  const cropVariety = farm.crop_variety || farm.crops?.[0]?.variety || farm.crops?.[0]?.crop_type;
  const farmersText = farm.farmers?.length > 0 ? farm.farmers.join(', ') : null;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
      <FarmMapThumbnail farmId={farm.id} />
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <h3 className="card-title" style={{ marginBottom: '8px', fontSize: '16px' }}>{farm.name}</h3>
          <div className="agro-chip-group" style={{ marginBottom: 0 }}>
            {farm.total_area_ha && (
              <span className="agro-chip">{farm.total_area_ha} Ha</span>
            )}
            {cropVariety && (
              <span className="agro-chip agro-chip-active">{cropVariety}</span>
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

const formatCurrency = (value) => {
  if (!value && value !== 0) return null;
  return `Rp ${Number(value).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const ManagerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
  // revenue_trend: array angka dari FinancialRecord, kosong jika tidak ada data
  const revenueTrend = stats?.revenue_trend?.length > 0 ? stats.revenue_trend : null;

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
          aria-label="Pengaturan profil"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>settings</span>
          Pengaturan
        </button>
      </header>

      {/* METRICS 2x2 GRID */}
      <section aria-label="Metrik Utama" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="stats-grid-2x2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            <>
              {/* Kartu 1: Serapan Karbon — data dari EsgMetric.carbon_footprint */}
              <StatCard
                title="SERAPAN KARBON"
                value={totalCarbonTon !== null ? `${totalCarbonTon} ton` : '-'}
                badgeText="Biomassa Lahan Aktif"
                variant="dark"
              />

              {/* Kartu 2: Nilai Ekonomi — data dari FinancialRecord.estimated_revenue */}
              <StatCard
                title="NILAI EKONOMI (EST)"
                value={formatCurrency(totalRevenue) ?? '-'}
                chartData={revenueTrend}
                chartColor="var(--color-bright-emerald)"
                chartFill="rgba(16, 185, 129, 0.08)"
              />

              {/* Kartu 3: Lahan & Petani — data dari Farm.count + Farmer.count */}
              <StatCard
                title="LAHAN & PETANI"
                value={totalFarms !== null ? `${totalFarms} Lahan` : '-'}
                badgeText={totalFarmers !== null ? `${totalFarmers} Petani Terdaftar` : null}
                badgeType="neutral"
                chartData={farms.length > 0 ? farms.map((_, i) => i + 1) : null}
                chartColor="var(--color-dark-amber)"
                chartFill="rgba(217, 119, 6, 0.08)"
              />

              {/* Kartu 4: Luas Lahan & Komoditas — data dari Farm.total_area_ha + Farm.crop_variety */}
              <StatCard
                title="TOTAL LUAS LAHAN"
                value={totalAreaHa !== null ? `${totalAreaHa} Ha` : '-'}
                badgeText={primaryCommodity ? `Komoditas: ${primaryCommodity}` : null}
                badgeType="neutral"
                chartData={farms.length > 0 ? farms.map(f => parseFloat(f.total_area_ha) || 0) : null}
                chartColor="var(--color-main-green)"
                chartFill="rgba(17, 106, 58, 0.08)"
              />
            </>
          )}
        </div>
      </section>

      {/* DAFTAR LAHAN PROJECT */}
      <section aria-label="Daftar Lahan Project">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-main)', margin: '0 0 2px 0' }}>
              Daftar Lahan Project
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
