import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Building2, Package, MapPin, Sprout, Leaf, Users, TrendingUp, Trees, BadgeCheck } from 'lucide-react';
import DetailCard from '../../shared/components/traceability/DetailCard';
import api from '../../shared/api/axios';

const ImpactStat = ({ label, value }) => (
  <div style={{ background: '#f8f9fa', padding: 8, borderRadius: 12, border: '1px solid rgba(233,236,239,0.5)', textAlign: 'center' }}>
    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', color: '#414844', textTransform: 'uppercase', margin: '0 0 4px 0' }}>{label}</p>
    <p style={{ fontSize: 24, fontWeight: 700, color: '#012d1d', margin: 0 }}>{value}</p>
  </div>
);

const ImpactRow = ({ label, value, valueColor }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
    <span style={{ fontSize: 14, color: '#414844' }}>{label}</span>
    <span style={{ fontWeight: 700, color: valueColor || '#191c1d' }}>{value}</span>
  </div>
);

const loadingSkeleton = (
  <div style={{ minHeight: '100vh', background: '#f8f9fa', color: '#191c1d', fontFamily: '"Hanken Grotesk", sans-serif' }}>
    <div style={{ height: 64, background: '#ffffff', borderBottom: '1px solid #E9ECEF', display: 'flex', alignItems: 'center', padding: '0 32px' }}>
      <div style={{ width: 180, height: 24, background: '#e1e3e4', borderRadius: 4 }} />
    </div>
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ width: '100%', height: 300, background: '#e1e3e4', borderRadius: 16, marginBottom: 32 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 100, background: '#e1e3e4', borderRadius: 12 }} />
        ))}
      </div>
      <div style={{ height: 150, background: '#e1e3e4', borderRadius: 12, marginBottom: 32 }} />
      <div style={{ height: 200, background: '#e1e3e4', borderRadius: 12, marginBottom: 32 }} />
    </div>
  </div>
);

const TraceabilityDashboard = () => {
  const { projectRef } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/assessment/trace/${projectRef}`);
        if (res.data.success) {
          setData(res.data.data);
        } else {
          setError(res.data.message || 'Data tidak ditemukan');
        }
      } catch (err) {
        setError('Gagal memuat data traceability');
      } finally {
        setLoading(false);
      }
    };
    if (projectRef) fetchData();
  }, [projectRef]);

  if (loading) return loadingSkeleton;
  if (error) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#6C757D', fontFamily: '"Hanken Grotesk", sans-serif' }}>
      {error}
    </div>
  );
  if (!data) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#6C757D', fontFamily: '"Hanken Grotesk", sans-serif' }}>
      Data tidak ditemukan
    </div>
  );

  const { project, profile, sdgs } = data;
  const projectName = profile?.title || project?.name || '';
  const companyName = project?.company_name || '';
  const tagline = profile?.tagline || '';
  const heroImage = profile?.hero_image_url || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200';
  const description = profile?.origin_story || profile?.description || '';

  // Narrative asli dari backend (project_traceability_profiles.social_narrative dst.)
  const socialNarrative = profile?.social_narrative || '';
  const economicNarrative = profile?.economic_narrative || '';
  const environmentalNarrative = profile?.environmental_narrative || '';

  return (
    <div style={{ minHeight: '100vh', background: '#0d2f1e', color: '#191c1d', fontFamily: '"Hanken Grotesk", sans-serif', position: 'relative', overflow: 'hidden' }}>
      {/* Decorative Circles */}
      <div style={{ position: 'absolute', top: -160, right: -180, width: 500, height: 500, borderRadius: '50%', background: 'rgba(22, 78, 46, 0.4)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: 400, left: -220, width: 450, height: 450, borderRadius: '50%', background: 'rgba(30, 95, 55, 0.3)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: 900, right: -200, width: 400, height: 400, borderRadius: '50%', background: 'rgba(16, 60, 34, 0.35)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: 1400, left: -180, width: 380, height: 380, borderRadius: '50%', background: 'rgba(34, 110, 60, 0.25)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: 1900, right: -160, width: 420, height: 420, borderRadius: '50%', background: 'rgba(22, 78, 46, 0.25)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: 2400, left: -200, width: 360, height: 360, borderRadius: '50%', background: 'rgba(30, 95, 55, 0.3)', pointerEvents: 'none', zIndex: 0 }} />
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 64,
        padding: '0 32px',
        background: '#ffffff',
        borderBottom: '1px solid #E9ECEF',
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 50
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#0d2f1e' }}>Traceability Hub</div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 16px', paddingTop: 88, position: 'relative', zIndex: 1 }}>
        {/* Hero Image */}
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/6',
          height: 'auto',
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 32,
          boxShadow: '0 12px 40px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <img
            src={heroImage}
            alt={companyName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)'
          }} />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            padding: 24,
            width: '100%'
          }}>
            <h1 style={{
              fontSize: 32,
              fontWeight: 700,
              color: '#ffffff',
              margin: 0,
              marginBottom: 4,
              letterSpacing: '-0.02em',
              lineHeight: '40px'
            }}>
              {projectName || companyName}
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', margin: 0, fontStyle: 'italic' }}>
              {companyName && projectName && companyName !== projectName ? `${companyName} · ` : ''}{tagline}
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16,
          marginBottom: 32
        }}>
          <DetailCard icon={<Sprout size={20} />} label="Project" value={projectName} />
          <DetailCard icon={<Building2 size={20} />} label="Company" value={companyName} />
          <DetailCard icon={<Package size={20} />} label="Commodity" value={project?.commodity} />
          <DetailCard icon={<MapPin size={20} />} label="Location" value={project?.location} />
        </div>

        {/* Origin Story */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          padding: 24,
          marginBottom: 32,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
          transform: 'translateY(-2px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#1b4332', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
              <Sprout size={24} />
            </div>
            <div>
              <h2 style={{
                fontSize: 24,
                fontWeight: 600,
                color: '#191c1d',
                margin: 0,
                lineHeight: '32px'
              }}>
                Origin Story
              </h2>
            </div>
          </div>
          {description ? (
            <p style={{ fontSize: 16, lineHeight: '24px', color: '#414844', margin: '16px 0 0 0' }}>
              {description}
            </p>
          ) : (
            <p style={{ fontSize: 16, lineHeight: '24px', color: '#adb5bd', fontStyle: 'italic', margin: '16px 0 0 0' }}>
              Belum diisi
            </p>
          )}
        </div>

        {/* Sustainability Impact */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{
            fontSize: 24,
            fontWeight: 600,
            color: '#ffffff',
            margin: 0,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            lineHeight: '32px'
          }}>
            <Leaf size={24} style={{ color: '#86efac' }} />
            Sustainability Impact
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
            {/* Social Impact */}
            <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#1b4332', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                  <Users size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 600, color: '#191c1d', margin: 0, lineHeight: '28px' }}>Social Impact</h3>
                  <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#414844', margin: 0, textTransform: 'uppercase' }}>Community & Equity</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {[{ label: 'Partners', value: '42' }, { label: 'Female', value: '38' }, { label: 'Programs', value: '12' }].map((m) => (
                  <div key={m.label} style={{ background: '#f0f9f4', padding: 8, borderRadius: 12, textAlign: 'center' }}>
                    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', color: '#414844', textTransform: 'uppercase', margin: '0 0 4px 0' }}>{m.label}</p>
                    <p style={{ fontSize: 24, fontWeight: 700, color: '#012d1d', margin: 0 }}>{m.value}</p>
                  </div>
                ))}
              </div>
              {socialNarrative ? (
              <p style={{ fontSize: 14, lineHeight: '20px', color: '#414844', margin: 0 }}>{socialNarrative}</p>
            ) : (
              <p style={{ fontSize: 14, lineHeight: '20px', color: '#adb5bd', fontStyle: 'italic', margin: 0 }}>Belum diisi</p>
            )}
            </div>

            {/* Economic Impact */}
            <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#1b4332', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 600, color: '#191c1d', margin: 0, lineHeight: '28px' }}>Economic Impact</h3>
                  <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#414844', margin: 0, textTransform: 'uppercase' }}>Growth & Value</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 16 }}>
                {[{ label: 'Active Farm Area', value: '25 Ha' }, { label: 'Annual Yield', value: '1,250 Kg' }, { label: 'Carbon Credit', value: 'Rp136.7M' }].map((m, i, arr) => (
                  <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(233,236,239,0.4)' : 'none' }}>
                    <span style={{ fontSize: 14, color: '#414844' }}>{m.label}</span>
                    <span style={{ fontWeight: 700, color: '#191c1d' }}>{m.value}</span>
                  </div>
                ))}
              </div>
              {economicNarrative ? (
              <p style={{ fontSize: 14, lineHeight: '20px', color: '#414844', margin: 0 }}>{economicNarrative}</p>
            ) : (
              <p style={{ fontSize: 14, lineHeight: '20px', color: '#adb5bd', fontStyle: 'italic', margin: 0 }}>Belum diisi</p>
            )}
            </div>

            {/* Environmental Impact */}
            <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#1b4332', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                  <Trees size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 600, color: '#191c1d', margin: 0, lineHeight: '28px' }}>Environmental Impact</h3>
                  <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#414844', margin: 0, textTransform: 'uppercase' }}>Regeneration</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(233,236,239,0.4)' }}>
                  <span style={{ fontSize: 14, color: '#414844' }}>Land Area</span>
                  <span style={{ fontWeight: 700, color: '#191c1d' }}>186 Ha</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(233,236,239,0.4)' }}>
                  <span style={{ fontSize: 14, color: '#414844' }}>Carbon Stock</span>
                  <span style={{ fontWeight: 700, color: '#191c1d' }}>186 Ton C</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                  <span style={{ fontSize: 14, color: '#414844' }}>Farm Practice</span>
                  <span style={{ display: 'inline-block', padding: '4px 12px', background: '#d4edda', color: '#155724', fontSize: 11, fontWeight: 700, borderRadius: 9999, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Organic</span>
                </div>
              </div>
              {environmentalNarrative ? (
              <p style={{ fontSize: 14, lineHeight: '20px', color: '#414844', margin: 0 }}>{environmentalNarrative}</p>
            ) : (
              <p style={{ fontSize: 14, lineHeight: '20px', color: '#adb5bd', fontStyle: 'italic', margin: 0 }}>Belum diisi</p>
            )}
            </div>
          </div>
        </section>

        {/* SDGs Contribution */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{
            fontSize: 24,
            fontWeight: 600,
            color: '#ffffff',
            margin: 0,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            lineHeight: '32px'
          }}>
            <BadgeCheck size={24} style={{ color: '#86efac' }} />
            SDGs Contribution
          </h2>
          <p style={{ fontSize: 14, lineHeight: '20px', color: '#c8ddad', marginBottom: 24 }}>
            This farm contributes to the following Sustainable Development Goals based on Agrivision assessment and verification.
          </p>
          {sdgs && sdgs.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              {sdgs.map((sdg) => (
                <div key={sdg.goal_number} style={{
                  aspectRatio: '1',
                  background: '#ffffff',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)'
                }}>
                  {sdg.image_url ? (
                    <img
                      src={sdg.image_url}
                      alt={`SDG ${sdg.goal_number}: ${sdg.name}`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', fontSize: 12, color: '#6C757D' }}>
                      SDG {sdg.goal_number}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              background: '#ffffff',
              borderRadius: 12,
              padding: 32,
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <p style={{ fontSize: 14, color: '#adb5bd', fontStyle: 'italic', margin: 0 }}>
                Kontribusi SDG belum ditentukan
              </p>
            </div>
          )}
        </section>
      </main>

    </div>
  );
};

export default TraceabilityDashboard;
