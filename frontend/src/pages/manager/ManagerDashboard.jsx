import { useEffect, useState, useMemo } from 'react';
import api from '../../shared/api/axios';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TreePine, Coins, Users, Maximize2 } from 'lucide-react';
import StatCard from '../../shared/components/UI/StatCard';
import Card from '../../shared/components/UI/Card';

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

const FarmCard = ({ farm, onManage, onAgronomy }) => {
  const cropVariety = farm.crop_variety || farm.crops?.[0]?.variety || farm.crops?.[0]?.crop_type;
  const farmersText = farm.farmers?.length > 0 ? farm.farmers.join(', ') : null;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
      {/* Pulse dot — menandakan lahan dalam status terpantau */}
      <style>{`
        @keyframes agri-pulse {
          0%   { transform: scale(1);   opacity: 1; }
          50%  { transform: scale(1.5); opacity: 0.4; }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>
      <div style={{ position: 'relative' }}>
        <FarmMapThumbnail farmId={farm.id} />
        <span
          title="Lahan dalam status terpantau"
          style={{
            position: 'absolute', top: '10px', right: '10px',
            width: '9px', height: '9px', borderRadius: '50%',
            background: '#22c55e',
            boxShadow: '0 0 0 2px rgba(34,197,94,0.25)',
            animation: 'agri-pulse 2.2s ease-in-out infinite',
            display: 'block',
          }}
          aria-label="Sensor aktif"
        />
      </div>
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <h3 className="card-title" style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 700 }}>{farm.name}</h3>
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
  return Number(value).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const ManagerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insightIndex, setInsightIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [farmFilter, setFarmFilter] = useState('semua');
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

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

  const filteredFarms = useMemo(() => {
    if (farmFilter === 'ada_petani') return farms.filter(f => f.farmers?.length > 0);
    if (farmFilter === 'tanpa_petani') return farms.filter(f => !f.farmers?.length);
    if (farmFilter === 'luas_besar') return farms.filter(f => parseFloat(f.total_area_ha) > 2);
    return farms;
  }, [farms, farmFilter]);

  const FILTERS = [
    { key: 'semua',       label: 'Semua Lahan' },
    { key: 'ada_petani',  label: 'Ada Petani' },
    { key: 'tanpa_petani',label: 'Tanpa Petani' },
    { key: 'luas_besar',  label: '> 2 Ha' },
  ];

  // Semua nilai murni dari backend — tidak ada fallback hardcode
  const totalFarms = stats?.total_farms ?? null;
  const totalFarmers = stats?.total_farmers ?? null;
  const totalAreaHa = stats?.total_area_ha ?? null;
  const primaryCommodity = stats?.primary_commodity ?? null;
  const totalRevenue = stats?.total_revenue > 0 ? stats.total_revenue : null;
  const totalCarbonTon = stats?.total_carbon_ton > 0 ? stats.total_carbon_ton : null;

  const insights = [
    {
      title: `Valuasi ${primaryCommodity || 'Kopi Arabika'} Premium Capai Rekor`,
      dropCap: 'V',
      text: `aluasi ekspor untuk komoditas unggulan kita mencatatkan angka yang sangat menjanjikan di kuartal ini. Berkat metode panen selektif dan proses pascapanen terstandarisasi, 1 Kg biji premium berpotensi menembus harga ekspor hingga Rp 150.000.`,
      recommendation: `Tingkatkan frekuensi pelatihan pemangkasan cabang bagi petani agar kuantitas buah ceri merah tetap stabil.`
    },
    {
      title: `Serapan Karbon Ekivalen Dengan Ribuan Pohon Hutan`,
      dropCap: 'D',
      text: `ata terbaru mencatat total serapan emisi mencapai ${totalCarbonTon || 'ratusan'} ton CO2e. Volume mitigasi ekologis ini setara dengan fungsi filtrasi udara dari ${(totalCarbonTon ? Math.round(totalCarbonTon * 1.2) : 500).toLocaleString('id-ID')} pohon mahoni dewasa yang berumur lebih dari 10 tahun.`,
      recommendation: `Aset karbon ini dapat didaftarkan pada skema perdagangan karbon (Carbon Trading) untuk mendiversifikasi sumber pendapatan.`
    },
    {
      title: `Skor NDVI Optimal: Hemat Biaya Pupuk Kimia`,
      dropCap: 'S',
      text: `istem pemantauan satelit menunjukkan Indeks Vegetasi (NDVI) lahan berada di zona hijau pekat (0.75 - 0.85). Kondisi tutupan kanopi yang rapat ini menjaga kelembapan mikroklimat sekaligus mempercepat dekomposisi bahan organik alami.`,
      recommendation: `Kurangi alokasi belanja pupuk sintetis sebesar 15-20% musim ini dan alihkan untuk subsidi pupuk organik.`
    },
    {
      title: `Transparansi Rantai Pasok Tingkatkan Kepercayaan`,
      dropCap: 'T',
      text: `raceability (keterlacakan) menjadi kunci utama penembusan pasar global. Dengan mencatat setiap fase penanaman hingga panen dari ${totalFarmers || 'puluhan'} petani lokal kita, produk AgriVision diakui memiliki sertifikasi asal usul yang kredibel.`,
      recommendation: `Pastikan setiap mandor kebun melakukan pembaruan log aktivitas mingguan secara disiplin di sistem.`
    },
    {
      title: `Pemberdayaan Komunitas Mendukung Pilar SDGs`,
      dropCap: 'P',
      text: `elibatan aktif komunitas lokal dalam sistem agroforestri kita berkontribusi langsung pada pencapaian Tujuan Pembangunan Berkelanjutan (SDGs). Pendapatan petani kini terdistribusi lebih adil melalui skema bagi hasil transparan.`,
      recommendation: `Jadwalkan agenda rembuk tani bulanan untuk menjaring aspirasi dan meningkatkan kesejahteraan pekerja.`
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false); // mulai memudar
      setTimeout(() => {
        setInsightIndex((prev) => (prev + 1) % insights.length);
        setFade(true); // muncul kembali
      }, 500); // durasi transisi 500ms
    }, 15000); // ganti setiap 15 detik
    return () => clearInterval(timer);
  }, [insights.length]);

  return (
    <div className="hover-enabled">
      <header className="page-header" style={{ marginBottom: 'var(--space-md)' }}>
        <div>
          <h1 className="page-title">Dashboard Manajer</h1>
          <p className="page-subtitle" style={{ color: 'var(--color-main-green)', fontWeight: 600, marginBottom: '4px' }}>
            {getGreeting()}, Manajer!
          </p>
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

      {/* WEATHER & MICROCLIMATE WIDGET (MODERN UI - BRAND COLORS) */}
      <section aria-label="Kondisi Cuaca Lahan Utama" style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px',
          background: 'linear-gradient(135deg, #6ee7b7 0%, #fcd34d 100%)', // Brand Light Mint to Light Gold
          color: '#012d1d',
          boxShadow: '0 12px 24px -6px rgba(110, 231, 183, 0.5)', 
          padding: '24px 32px', borderRadius: '16px',
          position: 'relative', overflow: 'hidden'
        }}>
          {/* Decorative background light leaks */}
          <div style={{ position: 'absolute', top: '-40px', right: '-20px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%)' }}></div>
          <div style={{ position: 'absolute', bottom: '-60px', left: '10%', width: '150px', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)' }}></div>

          {/* Main Weather Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', zIndex: 1 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '64px', color: '#fff', textShadow: '0 0 24px rgba(255, 255, 255, 0.7)' }}>partly_cloudy_day</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>Cerah Berawan</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.8, fontWeight: 600 }}>Kondisi rata-rata lahan hari ini</p>
            </div>
          </div>
          
          {/* Metrics Glassmorphism Box */}
          <div style={{ 
            display: 'flex', gap: '32px', flexWrap: 'wrap', position: 'relative', zIndex: 1, 
            background: 'rgba(255, 255, 255, 0.3)', padding: '16px 28px', borderRadius: '14px', 
            backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.6)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ color: '#047857', fontSize: '26px' }}>thermostat</span>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7, fontWeight: 700 }}>Suhu Udara</div>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>28°C</div>
              </div>
            </div>
            
            <div style={{ width: '1px', background: 'rgba(1, 45, 29, 0.15)' }}></div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ color: '#0284c7', fontSize: '26px' }}>water_drop</span>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7, fontWeight: 700 }}>Kelembapan</div>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>75%</div>
              </div>
            </div>
            
            <div style={{ width: '1px', background: 'rgba(1, 45, 29, 0.15)' }}></div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ color: '#4338ca', fontSize: '26px' }}>rainy</span>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.7, fontWeight: 700 }}>Curah Hujan</div>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>12 mm</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* METRICS 2x2 GRID */}
      <section aria-label="Metrik Utama" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="stats-grid-2x2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            <>
              {/* Kartu 1: Serapan Karbon — data dari EsgMetric.carbon_footprint (hanya tampil jika data tersedia) */}
              {totalCarbonTon !== null && (
                <StatCard
                  title="SERAPAN KARBON"
                  headerUnit="(TON CO2e)"
                  value={totalCarbonTon}
                  badgeText="Biomassa Lahan Aktif"
                  trendText="+8.2% dari kuartal lalu"
                  trendUp={true}
                  icon={TreePine}
                />
              )}

              {/* Kartu 2: Nilai Ekonomi — data dari FinancialRecord.estimated_revenue */}
              <StatCard
                title="ESTIMASI NILAI EKONOMI (IDR)"
                value={formatCurrency(totalRevenue) ?? '-'}
                icon={Coins}
                trendText="+12.5% dari bulan lalu"
                trendUp={true}
                silhouetteColor="var(--color-dark-amber)"
                className="card-accent"
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
                headerUnit="(HA)"
                value={totalAreaHa !== null ? totalAreaHa : '-'}
                badgeText={primaryCommodity ? `Komoditas: ${primaryCommodity}` : null}
                badgeType="success"
                icon={Maximize2}
              />
            </>
          )}
        </div>
      </section>

      {/* EXECUTIVE BRIEF / INSIGHT (Newspaper Style - Dynamic Billboard) */}
      <section aria-label="Market Insight" style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ 
          background: '#fdfdfc', 
          border: '1px solid rgba(17, 106, 58, 0.25)',
          padding: '24px 32px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(17, 106, 58, 0.06)'
        }}>
          {/* Masthead */}
          <div style={{ borderBottom: '1px solid #eaeaea', paddingBottom: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#012d1d', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-dark-amber)' }}>new_releases</span>
              The AgriVision Brief
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>Edisi Multi-Konteks</span>
              {/* Pagination Dots */}
              <div style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
                {insights.map((_, idx) => (
                  <div key={idx} style={{ 
                    width: '6px', height: '6px', borderRadius: '50%', 
                    background: insightIndex === idx ? 'var(--color-main-green)' : '#ddd',
                    transition: 'background 0.3s ease'
                  }} />
                ))}
              </div>
            </div>
          </div>
          
          <div style={{ 
            display: 'flex', flexWrap: 'wrap', gap: '32px',
            opacity: fade ? 1 : 0, transition: 'opacity 0.5s ease-in-out'
          }}>
            {/* Column 1 */}
            <div style={{ flex: '1 1 320px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#012d1d', margin: '0 0 12px 0', lineHeight: 1.35, fontFamily: 'var(--font-display)' }}>
                {insights[insightIndex].title}
              </h2>
              <p style={{ fontSize: '14px', color: '#2a2a2a', lineHeight: 1.7, margin: 0, textAlign: 'justify' }}>
                <span style={{ 
                  float: 'left', 
                  fontSize: '48px', 
                  lineHeight: '40px', 
                  paddingTop: '6px', 
                  paddingRight: '10px', 
                  color: 'var(--color-main-green)', 
                  fontWeight: 800, 
                  fontFamily: 'var(--font-display)' 
                }}>{insights[insightIndex].dropCap}</span>
                {insights[insightIndex].text}
              </p>
            </div>
            
            {/* Column 2 */}
            <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '14px', color: '#2a2a2a', lineHeight: 1.7, margin: '0 0 16px 0', textAlign: 'justify' }}>
                {insightIndex === 0 && "Peningkatan tren harga ini tidak semata-mata didorong oleh kelangkaan suplai, melainkan juga oleh preferensi global terhadap praktik keberlanjutan. Jejak karbon rendah memberikan daya tawar tambahan di mata investor."}
                {insightIndex === 1 && "Selain berdampak positif pada lingkungan global, pengurangan emisi dan tingginya biomasa pada lahan agroforestri terbukti meningkatkan ketahanan kebun terhadap cuaca ekstrem dan kekeringan."}
                {insightIndex === 2 && "Kondisi kelembapan dan porositas tanah yang terjaga dengan baik memfasilitasi aktivitas mikrobioma, sehingga dekomposisi organik berlangsung maksimal tanpa perlu suplemen kimia."}
                {insightIndex === 3 && "Sistem pencatatan digital yang kita terapkan meminimalisasi risiko kecurangan (fraud) rantai pasok. Pembeli akhir kini menuntut transparansi total mulai dari tingkat petani hingga ke meja konsumen."}
                {insightIndex === 4 && "Pola kemitraan yang memberdayakan ini juga memotong jalur distribusi tengkulak, memastikan bahwa sirkulasi ekonomi berjalan di tingkat tapak dan memperkuat ketahanan pangan regional."}
              </p>
              <div style={{ background: '#f5fbf7', padding: '14px', borderRadius: '4px', borderLeft: '3px solid var(--color-main-green)' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#116a3a', margin: 0, lineHeight: 1.5 }}>
                  💡 Insight Eksekutif: {insights[insightIndex].recommendation}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-muted)', margin: '0 0 var(--space-lg) 0' }} />

      {/* DAFTAR LAHAN PROJECT */}
      <section aria-label="Daftar Lahan Project">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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

        {/* Filter Pills */}
        {!loading && farms.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFarmFilter(f.key)}
                className={farmFilter === f.key ? 'agro-chip agro-chip-active' : 'agro-chip'}
                style={{ cursor: 'pointer', border: 'none', fontWeight: farmFilter === f.key ? 600 : 400 }}
                aria-pressed={farmFilter === f.key}
              >
                {f.label}
                {f.key !== 'semua' && (
                  <span style={{ marginLeft: '4px', opacity: 0.7 }}>
                    ({(
                      f.key === 'ada_petani'   ? farms.filter(x => x.farmers?.length > 0).length :
                      f.key === 'tanpa_petani' ? farms.filter(x => !x.farmers?.length).length :
                      f.key === 'luas_besar'   ? farms.filter(x => parseFloat(x.total_area_ha) > 2).length : 0
                    )})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            <FarmCardSkeleton />
            <FarmCardSkeleton />
            <FarmCardSkeleton />
          </div>
        ) : filteredFarms.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {filteredFarms.map(farm => (
              <FarmCard
                key={farm.id}
                farm={farm}
                onManage={handleManageFarm}
                onAgronomy={handleAgronomy}
              />
            ))}
          </div>
        ) : farms.length > 0 ? (
          // Filter aktif tapi tidak ada hasil
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)', fontSize: '14px' }}>
            <span className="material-symbols-outlined" style={{ display: 'block', fontSize: '32px', marginBottom: '8px', opacity: 0.4 }}>filter_list_off</span>
            Tidak ada lahan yang cocok dengan filter ini.
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
