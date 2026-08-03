import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Building2, Package, MapPin, Sprout, Leaf, Users, TrendingUp, Trees, BadgeCheck, QrCode } from 'lucide-react';

const MOCK_DATA = {
  batch_number: 'BATCH-2025-001',
  company_name: 'Kadatuan Coffee',
  project_name: 'Arabica Highland Program',
  commodity: 'Coffee',
  location: 'Aceh Tengah',
  tagline: 'Sustainable Coffee Producer',
  hero_image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD28qUbQqnnZph3tfC8qS_yYSQn5ogy6Ue8gc7371ubmxLE5RCoaHlXqHhB1H0qv1_-XHdfYi2SwwAZru1NO5V4qIyCfOW8MkQA0peEXLqDRxuLGTEZcBoNWmg8gVLWHo3NhJ4V8xd1eJRVQRs5zHudcDpJYKTk0tIj0scstDVaCHU4qLDQ99abm-nyqB2ijQRMKMkKbUNpaXNqjTMVZwCU5qu2Y68WTtJ_GjiGn_c9f3SmJthIGD58IQ0v3Fw6aKub82RQ7udeb74',
  description: 'Kadatuan Coffee is dedicated to producing premium Arabica beans while fostering a regenerative agricultural ecosystem. Our philosophy centers on the harmony between nature and community, ensuring that every harvest supports biodiversity and provides sustainable livelihoods for our partner farmers in the highlands of Central Aceh.',
  sustainability: {
    social: {
      partners: 42,
      female: 38,
      programs: 12,
      description: 'Our social initiatives focus on gender equity and community resilience through dedicated training programs and fair trade partnerships.'
    },
    economic: {
      active_farm_area: '25 Ha',
      annual_yield: '1,250 Kg',
      carbon_credit: 'Rp136.7M',
      description: 'Kontribusi ekonomi dari kegiatan pertanian, skala produksi, dan potensi nilai ekonomi dari pengelolaan karbon berkelanjutan.'
    },
    environmental: {
      land_area: '186 Ha',
      carbon_stock: '186 Ton C',
      farm_practice: 'Organic',
      description: 'Indikator kondisi lingkungan yang mendukung praktik pertanian berkelanjutan dan penyimpanan karbon.'
    }
  },
  sdgs: ['2', '8', '12', '13', '15']
};

const SDG_IMAGES = {
  '2': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAm4g6v_eTbbeQsJezN-rSqHmJ9_KxvpMi04-iBdi2ZaWRdUZWRKTL3x9NY-Suuwd3z_SF3DHM7aw60RDuZRDPmjYwqfa6G5_BSKI2dgsqAEJ34_7Z9foM6MXIx8Rl6ilXM4K-78u5v2E0cqPx_Rk0w_qvtZXPBHG8CCHgEt7ySLwxVth1_Zs8orO6YChGDB84DUzEjMkU7rmVH4Rxn8WWV73Bc8o2Xa9hOk6YJ8wFQVf5FsfD09WCqXnxgo9vjjoVlXesAgDX3B9E',
  '8': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcCPdTdFZdLq_duR68QXBRRuwQbsXuYGJzWtFUQqRQaAKsu3S753F9FVg9Guj0i6xOKUpVGDXnj_gpFytpe8ctbJ1IF48A95fEn5JFL2qi23OwLaheKxqgDbhcuTPntTj4pMJsuYQregcMcuQlRtPd_TGdJhS_nz716ZW6Tm7praBIzdB4MEMeyt2vs8yKrw3XnE834Zfw2E1U_fbzoVXkIOMxAEY3V4GL7p9qxeBsdSyhedPmHkKEiuDC7WmYNI8yShtFXZimpQ0',
  '12': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBx4D1Wx4gRnEcXczORBRC8V8vkdAWknjO4E-_Dp6_hzzmfa8g5r0ObM_pMEYE9cSyy5lpCqEosdoURibJSF4pSY4IZijVPzi1WCsoQ-__D7YlJREhdX5WHidjHzMNZ8EwxUe80Xjo3fHQn22VspOQuG3vJT2Zc8BeBEpgM1F3ww0Z4shmb-u_oLHkkz9dOCE79PGMhxLkljw4ACKHcUTOtWiq_ZijR2uxSjRHei_SZdzXBb7K8yFW1Juu4plSfjuobhXvwmS54FZk',
  '13': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMnpvd59rR1VWtQFcw6eMHRVgUzu-gqlTeS9EK4xV6ho-F1VceKiVAR1VYzCceCS-my2hFkBrZYIhr5NOo84IA0rNAduUuGN6OnpfUtQAw5hK45UBA-CnAylrFw-6daJXI9i2TuXA8xA40fjwAtc-HJQysZnVEyYEdzstqLy9bYBNNdjHtuQSXh2h-WphRnPw6WKMlDa8w7oRaSy_1MnGqN4UKVbnMAOte26hovZnCLaD7GZQlgrBXZejInM4M_j1FXKT0uammxJo',
  '15': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDHU9nSAia2vTcliNuWy-XTAlNUMfUqh8BClbo1RTGkbg7YLGi6wEAcNrJ2_lqoHSEgzfYgKIPm5lU-Iot_HAMCu2bY1jE-hD5D-lltWzE0QdvLPYjoUS8yddjLznRP9XsCg75CZpBCR24Nss0v3bv7yU3xf4OyM6s1G7HHfzlVD8Nke76XFJ8NW9ozX-PvxJEty-9q9wfQhMxJpaYJcrsMw7Gcm6ahy3GwV3AmWsVkprm1bPLf9WIbXmmDYY-_pT-HP529-PqzHRU'
};

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
  const [data] = useState(MOCK_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, [projectRef]);

  if (loading) return loadingSkeleton;
  if (!data) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#6C757D', fontFamily: '"Hanken Grotesk", sans-serif' }}>
      Data tidak ditemukan
    </div>
  );

  const s = data.sustainability;

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', color: '#191c1d', fontFamily: '"Hanken Grotesk", sans-serif', paddingBottom: 96 }}>
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
        <div style={{ fontSize: 20, fontWeight: 700, color: '#012d1d' }}>Traceability Hub</div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1440, margin: '0 auto', padding: '24px 16px', paddingTop: 88 }}>
        {/* Hero Image */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: 300,
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 32,
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          border: '1px solid #E9ECEF'
        }}>
          <img
            src={data.hero_image_url}
            alt={data.company_name}
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
            <span style={{
              display: 'inline-block',
              padding: '4px 16px',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(8px)',
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#ffffff',
              marginBottom: 12,
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              Verified Origin
            </span>
            <h1 style={{
              fontSize: 32,
              fontWeight: 700,
              color: '#ffffff',
              margin: 0,
              marginBottom: 4,
              letterSpacing: '-0.02em',
              lineHeight: '40px'
            }}>
              {data.project_name || data.company_name}
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', margin: 0, fontStyle: 'italic' }}>
              {data.company_name && data.project_name && data.company_name !== data.project_name ? `${data.company_name} · ` : ''}{data.tagline}
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
          <div style={{
            background: '#ffffff',
            border: '1px solid #E9ECEF',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#414844' }}>
              <Sprout size={20} />
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>Project</span>
            </div>
            <p style={{ fontSize: 20, fontWeight: 600, color: '#191c1d', margin: 0 }}>{data.project_name}</p>
          </div>
          <div style={{
            background: '#ffffff',
            border: '1px solid #E9ECEF',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#414844' }}>
              <Building2 size={20} />
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>Company</span>
            </div>
            <p style={{ fontSize: 20, fontWeight: 600, color: '#191c1d', margin: 0 }}>{data.company_name}</p>
          </div>
          <div style={{
            background: '#ffffff',
            border: '1px solid #E9ECEF',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#414844' }}>
              <Package size={20} />
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>Commodity</span>
            </div>
            <p style={{ fontSize: 20, fontWeight: 600, color: '#191c1d', margin: 0 }}>{data.commodity}</p>
          </div>
          <div style={{
            background: '#ffffff',
            border: '1px solid #E9ECEF',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#414844' }}>
              <MapPin size={20} />
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>Location</span>
            </div>
            <p style={{ fontSize: 20, fontWeight: 600, color: '#191c1d', margin: 0 }}>{data.location}</p>
          </div>
        </div>

        {/* Origin Story */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #b3cdb7',
          borderRadius: 12,
          padding: 24,
          marginBottom: 32,
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
        }}>
          <h2 style={{
            fontSize: 24,
            fontWeight: 600,
            color: '#191c1d',
            margin: 0,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            lineHeight: '32px'
          }}>
            <Sprout size={24} style={{ color: '#012d1d' }} />
            Origin Story
          </h2>
          <p style={{ fontSize: 16, lineHeight: '24px', color: '#414844', margin: 0 }}>
            {data.description}
          </p>
        </div>

        {/* Sustainability Impact */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 style={{
              fontSize: 24,
              fontWeight: 600,
              color: '#191c1d',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              lineHeight: '32px'
            }}>
              <Leaf size={24} style={{ color: '#012d1d' }} />
              Sustainability Impact
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Social Impact */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #E9ECEF',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: '#1b4332',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  <Users size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 600, color: '#191c1d', margin: 0, lineHeight: '28px' }}>Social Impact</h3>
                  <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#414844', margin: 0, textTransform: 'uppercase' }}>
                    Community &amp; Equity
                  </p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                <div style={{ background: '#f8f9fa', padding: 8, borderRadius: 12, border: '1px solid rgba(233,236,239,0.5)', textAlign: 'center' }}>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', color: '#414844', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Partners</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: '#012d1d', margin: 0 }}>{s.social.partners}</p>
                </div>
                <div style={{ background: '#f8f9fa', padding: 8, borderRadius: 12, border: '1px solid rgba(233,236,239,0.5)', textAlign: 'center' }}>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', color: '#414844', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Female</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: '#012d1d', margin: 0 }}>{s.social.female}</p>
                </div>
                <div style={{ background: '#f8f9fa', padding: 8, borderRadius: 12, border: '1px solid rgba(233,236,239,0.5)', textAlign: 'center' }}>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', color: '#414844', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Programs</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: '#012d1d', margin: 0 }}>{s.social.programs}</p>
                </div>
              </div>
              <p style={{ fontSize: 14, lineHeight: '20px', color: '#414844', margin: 0 }}>{s.social.description}</p>
            </div>

            {/* Economic Impact */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #E9ECEF',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: '#1b4332',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 600, color: '#191c1d', margin: 0, lineHeight: '28px' }}>Economic Impact</h3>
                  <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#414844', margin: 0, textTransform: 'uppercase' }}>
                    Growth &amp; Value
                  </p>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                  <span style={{ fontSize: 14, color: '#414844' }}>Active Farm Area</span>
                  <span style={{ fontWeight: 700, color: '#191c1d' }}>{s.economic.active_farm_area}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                  <span style={{ fontSize: 14, color: '#414844' }}>Annual Yield</span>
                  <span style={{ fontWeight: 700, color: '#191c1d' }}>{s.economic.annual_yield}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                  <span style={{ fontSize: 14, color: '#414844' }}>Carbon Credit</span>
                  <span style={{ fontWeight: 700, color: '#2D6A4F' }}>{s.economic.carbon_credit}</span>
                </div>
              </div>
              <p style={{ fontSize: 14, lineHeight: '20px', color: '#414844', margin: 0 }}>{s.economic.description}</p>
            </div>

            {/* Environmental Impact */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #E9ECEF',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: '#1b4332',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}>
                  <Trees size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 600, color: '#191c1d', margin: 0, lineHeight: '28px' }}>Environmental Impact</h3>
                  <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#414844', margin: 0, textTransform: 'uppercase' }}>
                    Regeneration
                  </p>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                  <span style={{ fontSize: 14, color: '#414844' }}>Land Area</span>
                  <span style={{ fontWeight: 700, color: '#191c1d' }}>{s.environmental.land_area}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                  <span style={{ fontSize: 14, color: '#414844' }}>Carbon Stock</span>
                  <span style={{ fontWeight: 700, color: '#191c1d' }}>{s.environmental.carbon_stock}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                  <span style={{ fontSize: 14, color: '#414844' }}>Farm Practice</span>
                  <span style={{
                    padding: '4px 12px',
                    background: '#a1f4c8',
                    color: '#1b724f',
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: 9999,
                    textTransform: 'uppercase'
                  }}>
                    {s.environmental.farm_practice}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: 14, lineHeight: '20px', color: '#414844', margin: 0 }}>{s.environmental.description}</p>
            </div>
          </div>


        </section>

        {/* SDGs Contribution */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{
            fontSize: 24,
            fontWeight: 600,
            color: '#191c1d',
            margin: 0,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            lineHeight: '32px'
          }}>
            <BadgeCheck size={24} style={{ color: '#012d1d' }} />
            SDGs Contribution
          </h2>
          <p style={{ fontSize: 14, lineHeight: '20px', color: '#414844', marginBottom: 24 }}>
            This farm contributes to the following Sustainable Development Goals based on Agrivision assessment and verification.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {data.sdgs.map(sdg => (
              <div key={sdg} style={{
                aspectRatio: '1',
                background: '#ffffff',
                border: '1px solid #E9ECEF',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 8,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                <img
                  src={SDG_IMAGES[sdg]}
                  alt={`SDG ${sdg}`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Mobile Bottom Nav */}
      <nav style={{
        display: 'flex',
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        zIndex: 50,
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '8px 16px',
        background: '#ffffff',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.04)',
        borderTop: '1px solid #E9ECEF',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#a1f4c8',
          color: '#1b724f',
          borderRadius: 16,
          padding: '4px 16px',
          width: 80,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
        }}>
          <QrCode size={24} style={{ marginBottom: 4 }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>QR Code</span>
        </div>

      </nav>
    </div>
  );
};

export default TraceabilityDashboard;
