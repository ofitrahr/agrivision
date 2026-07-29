import React, { useEffect, useState } from 'react';
import api from '../../shared/api/axios';
import {
  ChevronRight, CircleDollarSign, UtensilsCrossed, Heart,
  BookOpen, UserCheck, Droplets, Zap, Briefcase, Cog, Scale,
  Building2, Recycle, Globe, Fish, TreePine, Gavel, Handshake,
  Upload, Send, Info, Save, CheckCircle, MapPin, Sprout
} from 'lucide-react';

const SDG_LIST = [
  { number: 1, title: 'No Poverty', color: '#E5243B', icon: CircleDollarSign },
  { number: 2, title: 'Zero Hunger', color: '#DDA63A', icon: UtensilsCrossed },
  { number: 3, title: 'Good Health & Well-being', color: '#4C9F38', icon: Heart },
  { number: 4, title: 'Quality Education', color: '#C5192D', icon: BookOpen },
  { number: 5, title: 'Gender Equality', color: '#FF3A21', icon: UserCheck },
  { number: 6, title: 'Clean Water & Sanitation', color: '#26BDE2', icon: Droplets },
  { number: 7, title: 'Affordable & Clean Energy', color: '#FCC30B', icon: Zap },
  { number: 8, title: 'Decent Work & Economic Growth', color: '#A21942', icon: Briefcase },
  { number: 9, title: 'Industry, Innovation & Infrastructure', color: '#FD6925', icon: Cog },
  { number: 10, title: 'Reduced Inequalities', color: '#DD1367', icon: Scale },
  { number: 11, title: 'Sustainable Cities & Communities', color: '#FD9D24', icon: Building2 },
  { number: 12, title: 'Responsible Consumption & Production', color: '#BF8B2E', icon: Recycle },
  { number: 13, title: 'Climate Action', color: '#3F7E44', icon: Globe },
  { number: 14, title: 'Life Below Water', color: '#0A97D9', icon: Fish },
  { number: 15, title: 'Life on Land', color: '#56C02B', icon: TreePine },
  { number: 16, title: 'Peace, Justice & Strong Institutions', color: '#00689D', icon: Gavel },
  { number: 17, title: 'Partnerships for the Goals', color: '#19486A', icon: Handshake },
];

const MOCK_COMPANY = {
  id: 1,
  name: 'Kadatuan Coffee',
  logo_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuASjCkL_AXOeB1GkExv7fufLwX5nVr6G6bHmZUR_TkxRJsQ6cmtVYNRYsCd4LkNF-AWcRHx1UwZLMAzo__hle85kZnZD95bGB8xTHaz0eD_0L6s1-ZYMqk4eLWoXMA7mGNNf5vbQUss37-FQ7k7w5pFGQfFNg84AsoIu2lkyWRvVDNc8NmDlId2xOj2nM_RS5vPLG3E6V8PzfGz0xud9n4ReYLM3EeIgkh5m6og89Q-BynkrFq5BRvHV-I2v2cfXkoSVM5Qn_zE-qM',
  industry: 'Coffee',
  location: 'Aceh Tengah, Indonesia',
  assessment_date: '12 Jan 2026',
  assessor: 'Agrivision Team',
  status: 'Verified',
};

const MOCK_SELECTED = [2, 8, 12, 13, 15];

const AdminTraceability = () => {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(MOCK_COMPANY);
  const [selectedSdgs, setSelectedSdgs] = useState(MOCK_SELECTED);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveType, setSaveType] = useState(null); // 'draft' | 'publish'

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const res = await api.get('/admin/traceability/sdg-assessment');
        if (res.data.success) {
          const d = res.data.data;
          setCompany(d.company || MOCK_COMPANY);
          setSelectedSdgs(d.selected_sdgs || []);
          setNotes(d.notes || '');
        }
      } catch (error) {
        console.error('Gagal load SDG assessment', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssessment();
  }, []);

  const handleToggleSdg = (number) => {
    setSelectedSdgs(prev =>
      prev.includes(number)
        ? prev.filter(n => n !== number)
        : [...prev, number]
    );
  };

  const handleSave = async (type) => {
    setSaving(true);
    setSaveType(type);
    try {
      await api.post('/admin/traceability/sdg-assessment', {
        company_id: company.id,
        selected_sdgs: selectedSdgs,
        notes,
        status: type === 'publish' ? 'published' : 'draft',
      });
    } catch (error) {
      console.error('Gagal menyimpan assessment', error);
    } finally {
      setSaving(false);
      setSaveType(null);
    }
  };

  if (loading) return (
    <div style={{ padding: '50px', textAlign: 'center', color: '#6C757D' }}>
      Memuat data...
    </div>
  );

  const selectedIcon = (sdg) => {
    const Icon = sdg.icon;
    return Icon;
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#6C757D', marginBottom: 8 }}>
            <span>Admin</span>
            <ChevronRight size={14} />
            <span>Traceability</span>
            <ChevronRight size={14} />
            <span style={{ color: '#012d1d' }}>SDG Assessment</span>
          </div>
          <h1 className="page-title" style={{ margin: 0 }}>SDGs Framework Assessment</h1>
          <p className="page-description">Kelola penilaian Sustainable Development Goals untuk setiap perusahaan.</p>
        </div>
      </div>

      {/* Company Header Card */}
      <div className="stat-card" style={{
        padding: 32, marginBottom: 28,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: 48
      }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 12,
            background: '#c1ecd4', overflow: 'hidden', flexShrink: 0
          }}>
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={36} style={{ color: '#012d1d' }} />
              </div>
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: '#191c1d', margin: 0 }}>
                {company.name}
              </h2>
              <span style={{
                padding: '3px 12px', background: '#a1f4c8', color: '#005236',
                borderRadius: 9999, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                lineHeight: '18px'
              }}>
                ACTIVE COMPANY
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#6C757D' }}>
              <Sprout size={16} />
              <span>{company.industry}</span>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#c1c8c2', margin: '0 4px' }} />
              <MapPin size={16} />
              <span>{company.location}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 40 }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: '#6C757D', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
              Assessment Date
            </p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#191c1d', margin: 0 }}>
              {company.assessment_date}
            </p>
          </div>
          <div style={{ width: 1, background: '#E9ECEF', alignSelf: 'stretch' }} />
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: '#6C757D', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
              Assessor
            </p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#191c1d', margin: 0 }}>
              {company.assessor}
            </p>
          </div>
          <div style={{ width: 1, background: '#E9ECEF', alignSelf: 'stretch' }} />
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: '#6C757D', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
              Status
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
              <CheckCircle size={16} style={{ color: '#2D6A4F' }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#2D6A4F' }}>
                {company.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SDGs Framework Alignment */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
          <div>
            <h4 style={{ fontSize: 20, fontWeight: 700, color: '#012d1d', margin: '0 0 4px 0' }}>
              SDGs Framework Alignment
            </h4>
            <p style={{ fontSize: 14, color: '#414844', margin: 0 }}>
              Pilih Sustainable Development Goals yang secara aktif dikontribusikan oleh perusahaan ini.
            </p>
          </div>
          <span style={{
            padding: '8px 16px', border: '1px solid #E9ECEF', borderRadius: 8,
            fontSize: 12, fontWeight: 600, color: '#414844', background: '#ffffff'
          }}>
            {selectedSdgs.length} Selected
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 16
        }}>
          {SDG_LIST.map(sdg => {
            const isActive = selectedSdgs.includes(sdg.number);
            const Icon = sdg.icon;
            return (
              <div
                key={sdg.number}
                onClick={() => handleToggleSdg(sdg.number)}
                style={{
                  position: 'relative',
                  background: isActive ? 'rgba(161, 244, 200, 0.2)' : '#ffffff',
                  border: isActive ? '2px solid #116c4a' : '1px solid #E9ECEF',
                  borderRadius: 12, padding: 16,
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  display: 'flex', flexDirection: 'column', height: 160,
                  ...(isActive ? {} : { ':hover': { borderColor: '#3f6653' } })
                }}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => {}}
                  style={{
                    position: 'absolute', top: 16, right: 16,
                    width: 18, height: 18, borderRadius: 4,
                    accentColor: '#116c4a', cursor: 'pointer'
                  }}
                />
                <div style={{
                  width: 48, height: 48, borderRadius: 8,
                  background: isActive ? sdg.color : `${sdg.color}1A`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 12, transition: 'all 0.2s ease'
                }}>
                  <Icon size={24} style={{ color: isActive ? '#ffffff' : sdg.color }} />
                </div>
                <p style={{
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.03em',
                  color: isActive ? '#116c4a' : '#414844',
                  margin: '0 0 4px 0', textTransform: 'uppercase'
                }}>
                  GOAL {String(sdg.number).padStart(2, '0')}
                </p>
                <p style={{
                  fontSize: 14, color: '#191c1d', margin: 0,
                  lineHeight: '18px'
                }}>
                  {sdg.title}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assessor Observations + Supporting Evidence */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24
      }}>
        <div className="stat-card" style={{ padding: 24 }}>
          <h5 style={{
            fontSize: 12, fontWeight: 600, letterSpacing: '0.05em',
            color: '#6C757D', textTransform: 'uppercase', margin: '0 0 16px 0'
          }}>
            Assessor Observations
          </h5>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={8}
            placeholder="Enter detailed assessment notes regarding specific company practices for the selected SDGs..."
            style={{
              width: '100%', padding: 16, border: '1px solid #E9ECEF',
              borderRadius: 8, fontSize: 14, color: '#191c1d',
              outline: 'none', resize: 'vertical', fontFamily: 'inherit',
              boxSizing: 'border-box', background: '#f3f4f5'
            }}
          />
        </div>
        <div className="stat-card" style={{ padding: 24 }}>
          <h5 style={{
            fontSize: 12, fontWeight: 600, letterSpacing: '0.05em',
            color: '#6C757D', textTransform: 'uppercase', margin: '0 0 16px 0'
          }}>
            Supporting Evidence
          </h5>
          <div style={{
            border: '2px dashed #c1c8c2', borderRadius: 12, padding: 48,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', color: '#414844', textAlign: 'center'
          }}>
            <Upload size={40} style={{ marginBottom: 8, color: '#6C757D' }} />
            <p style={{ fontSize: 14, margin: '0 0 8px 0' }}>
              Drag and drop verification documents
            </p>
            <button style={{
              background: 'none', border: 'none', color: '#012d1d',
              fontSize: 12, fontWeight: 700, textDecoration: 'underline',
              cursor: 'pointer', fontFamily: 'inherit'
            }}>
              Browse Files
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div style={{
        position: 'sticky', bottom: 0,
        background: '#ffffff', borderTop: '1px solid #E9ECEF',
        padding: '16px 24px', margin: '0 -24px -24px -24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2D6A4F', fontSize: 12 }}>
          <Info size={16} />
          <span>Draft automatically saved at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => {
              setSelectedSdgs([]);
              setNotes('');
            }}
            style={{
              padding: '12px 32px', border: '1px solid #E9ECEF', borderRadius: 8,
              fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
              color: '#414844', background: '#ffffff', cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s ease'
            }}
          >
            CANCEL
          </button>
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            style={{
              padding: '12px 32px', border: '1px solid #012d1d', borderRadius: 8,
              fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
              color: '#012d1d', background: '#ffffff', cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            {saving && saveType === 'draft' ? (
              'Saving...'
            ) : (
              <>
                <Save size={16} />
                SAVE DRAFT
              </>
            )}
          </button>
          <button
            onClick={() => handleSave('publish')}
            disabled={saving}
            style={{
              padding: '12px 32px', border: 'none', borderRadius: 8,
              fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
              color: '#ffffff', background: '#012d1d', cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            {saving && saveType === 'publish' ? (
              'Publishing...'
            ) : (
              <>
                <Send size={16} />
                PUBLISH ASSESSMENT
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminTraceability;
