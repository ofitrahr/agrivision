import { useEffect, useState, useRef } from 'react';
import {
  ChevronRight, CircleDollarSign, UtensilsCrossed, Heart,
  BookOpen, UserCheck, Droplets, Zap, Briefcase, Cog, Scale,
  Building2, Recycle, Globe, Fish, TreePine, Gavel, Handshake,
  Send, Info, CheckCircle, MapPin,
  Search, ChevronDown, X, Upload, FileText, Trash2, User, ShieldCheck
} from 'lucide-react';
import api from '../../shared/api/axios';

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

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api$/, '') || '';
const formatUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BASE_URL}${url}`;
};


const getSdgMeta = (code) => {
  const num = parseInt(code, 10);
  const meta = SDG_LIST.find(s => s.number === num);
  if (meta) return { ...meta, code };
  return { number: num, title: code, color: '#6C757D', icon: Building2, code };
};

const AdminTraceability = () => {
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(false);

  const [sdgs, setSdgs] = useState([]);
  const [selectedSdgs, setSelectedSdgs] = useState([]);
  const [assessedBy, setAssessedBy] = useState('');
  const [verification, setVerification] = useState(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const res = await api.get('/admin/companies');
        if (res.data.success) setCompanies(res.data.data);
      } catch (error) {
        console.error('Gagal mengambil daftar company', error);
      } finally {
        setCompaniesLoading(false);
      }
    };
    loadCompanies();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCompany = async (companyId) => {
    setSelectedCompanyId(companyId);
    setCompany(companies.find(c => c.id === companyId) || null);
    setDropdownOpen(false);
    setSearchQuery('');
    setFeedback(null);
    setLoading(true);
    try {
      const res = await api.get(`/admin/companies/${companyId}/sdgs`);
      if (res.data.success) {
        const d = res.data.data;
        setSdgs(d.sdgs || []);
        setSelectedSdgs((d.sdgs || []).filter(s => s.selected).map(s => s.id));
        setAssessedBy(d.verification?.assessed_by || '');
        setVerification(d.verification || null);
      } else {
        setFeedback({ type: 'error', text: res.data.message });
      }
    } catch (error) {
      setFeedback({ type: 'error', text: error.response?.data?.message || 'Gagal memuat data SDG' });
    } finally {
      setLoading(false);
    }
  };

  const handleClearCompany = () => {
    setSelectedCompanyId(null);
    setCompany(null);
    setSdgs([]);
    setSelectedSdgs([]);
    setAssessedBy('');
    setVerification(null);
    setFeedback(null);
  };

  const handleToggleSdg = (sdgId) => {
    setSelectedSdgs(prev =>
      prev.includes(sdgId)
        ? prev.filter(id => id !== sdgId)
        : [...prev, sdgId]
    );
  };

  const handleUploadEvidence = async (file) => {
    if (!file || !company) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post(`/admin/companies/${company.id}/sdgs/verification/evidence`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setVerification(res.data.data);
        setFeedback({ type: 'success', text: res.data.message });
      } else {
        setFeedback({ type: 'error', text: res.data.message });
      }
    } catch (error) {
      setFeedback({ type: 'error', text: error.response?.data?.message || 'Gagal upload bukti' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteEvidence = async () => {
    if (!company) return;
    try {
      const res = await api.delete(`/admin/companies/${company.id}/sdgs/verification/evidence`);
      if (res.data.success) {
        setVerification(prev => prev ? { ...prev, evidence_file_url: null, evidence_file_type: null } : prev);
        setFeedback({ type: 'success', text: res.data.message });
      } else {
        setFeedback({ type: 'error', text: res.data.message });
      }
    } catch (error) {
      setFeedback({ type: 'error', text: error.response?.data?.message || 'Gagal menghapus bukti' });
    }
  };

  const handleSave = async () => {
    if (!company) return;
    setSaving(true);
    try {
      const res = await api.put(`/admin/companies/${company.id}/sdgs`, {
        sdgs: selectedSdgs.map((sdgId, index) => ({ sdg_id: sdgId, display_order: index })),
        assessed_by: assessedBy
      });
      if (res.data.success) {
        setFeedback({ type: 'success', text: res.data.message });
      } else {
        setFeedback({ type: 'error', text: res.data.message });
      }
    } catch (error) {
      setFeedback({ type: 'error', text: error.response?.data?.message || 'Gagal menyimpan assessment' });
    } finally {
      setSaving(false);
    }
  };

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (companiesLoading) return (
    <div style={{ padding: '50px', textAlign: 'center', color: '#6C757D' }}>
      Memuat daftar perusahaan...
    </div>
  );

  const evidenceFile = verification?.evidence_file_url
    ? { file_url: verification.evidence_file_url, file_type: verification.evidence_file_type }
    : null;

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
          <p className="page-description">Centang SDG yang dikontribusikan perusahaan, isi asesor, lalu lampirkan bukti.</p>
        </div>
      </div>

      {feedback && (
        <div style={{
          padding: '12px 16px', borderRadius: 8, marginBottom: 20,
          background: feedback.type === 'success' ? '#a1f4c8' : '#fecaca',
          color: feedback.type === 'success' ? '#1b724f' : '#991b1b',
          fontSize: 14, fontWeight: 500
        }}>
          {feedback.text}
        </div>
      )}

      {/* Company Selector */}
      <div ref={dropdownRef} style={{ position: 'relative', marginBottom: 28 }}>
        <div
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', border: '1px solid #E9ECEF',
            borderRadius: 8, cursor: 'pointer', background: '#ffffff',
            transition: 'border-color 0.2s ease'
          }}
        >
          <Search size={18} style={{ color: '#6C757D', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            {company ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 6,
                  background: '#c1ecd4', overflow: 'hidden', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Building2 size={16} style={{ color: '#012d1d' }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#191c1d' }}>{company.name}</div>
                  <div style={{ fontSize: 11, color: '#6C757D' }}>{company.subscription_plan || 'Klik untuk ganti perusahaan'}</div>
                </div>
              </div>
            ) : (
              <span style={{ fontSize: 14, color: '#6C757D' }}>Pilih perusahaan untuk dinilai...</span>
            )}
          </div>
          {company && (
            <button
              onClick={(e) => { e.stopPropagation(); handleClearCompany(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#6C757D' }}
            >
              <X size={16} />
            </button>
          )}
          <ChevronDown size={18} style={{ color: '#6C757D', flexShrink: 0 }} />
        </div>

        {dropdownOpen && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
            marginTop: 4, background: '#ffffff', border: '1px solid #E9ECEF',
            borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            maxHeight: 360, display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: '8px 8px 4px' }}>
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari perusahaan..."
                style={{
                  width: '100%', padding: '10px 12px', border: '1px solid #E9ECEF',
                  borderRadius: 6, fontSize: 14, outline: 'none', fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ overflow: 'auto', flex: 1, padding: 4 }}>
              {filteredCompanies.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: '#6C757D', fontSize: 14 }}>
                  Perusahaan tidak ditemukan
                </div>
              ) : (
                filteredCompanies.map(c => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCompany(c.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
                      background: selectedCompanyId === c.id ? '#f0fdf4' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => { if (selectedCompanyId !== c.id) e.currentTarget.style.background = '#f8f9fa'; }}
                    onMouseLeave={(e) => { if (selectedCompanyId !== c.id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 6,
                      background: '#c1ecd4', overflow: 'hidden', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Building2 size={18} style={{ color: '#012d1d' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#191c1d' }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: '#6C757D' }}>
                        {c.subscription_plan || ''}
                      </div>
                    </div>
                    {selectedCompanyId === c.id && (
                      <CheckCircle size={16} style={{ color: '#116c4a' }} />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Company Detail */}
      {company && (
        <div className="stat-card" style={{
          padding: 24, marginBottom: 28,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: 32
        }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 12,
              background: '#c1ecd4', overflow: 'hidden', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Building2 size={28} style={{ color: '#012d1d' }} />
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#191c1d', margin: '0 0 4px 0' }}>
                {company.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#6C757D' }}>
                <span>{company.subscription_plan || 'Tidak ada paket'}</span>
              </div>
              {company.address && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6C757D', marginTop: 4 }}>
                  <MapPin size={13} /> {company.address}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 32 }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: '#6C757D', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
                SDG Terpilih
              </p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#191c1d', margin: 0 }}>
                {selectedSdgs.length} dari {sdgs.length}
              </p>
            </div>
            <div style={{ width: 1, background: '#E9ECEF', alignSelf: 'stretch' }} />
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: '#6C757D', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
                Verifikasi
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                <CheckCircle size={14} style={{ color: verification?.assessed_by && verification?.evidence_file_url ? '#2D6A4F' : '#6C757D' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: verification?.assessed_by && verification?.evidence_file_url ? '#2D6A4F' : '#6C757D' }}>
                  {verification?.assessed_by && verification?.evidence_file_url ? 'Lengkap' : 'Belum Lengkap'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SDGs Framework Alignment */}
      {!company ? (
        <div style={{
          textAlign: 'center', padding: '80px 24px',
          border: '2px dashed #E9ECEF', borderRadius: 12,
          marginBottom: 24
        }}>
          <Building2 size={48} style={{ color: '#c1c8c2', marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#414844', margin: '0 0 8px 0' }}>
            Pilih Perusahaan
          </h3>
          <p style={{ fontSize: 14, color: '#6C757D', margin: 0 }}>
            Gunakan pencarian di atas untuk memilih perusahaan yang akan dinilai SDGs-nya.
          </p>
        </div>
      ) : loading ? (
        <div style={{
          textAlign: 'center', padding: '60px 24px', marginBottom: 24,
          color: '#6C757D'
        }}>
          Memuat data assessment...
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
            <div>
              <h4 style={{ fontSize: 20, fontWeight: 700, color: '#012d1d', margin: '0 0 4px 0' }}>
                SDGs Framework Alignment
              </h4>
              <p style={{ fontSize: 14, color: '#414844', margin: 0 }}>
                Centang SDG yang dikontribusikan oleh perusahaan ini.
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 16
          }}>
            {sdgs.map(sdg => {
              const meta = getSdgMeta(sdg.code);
              const isActive = selectedSdgs.includes(sdg.id);
              const Icon = meta.icon;
              return (
                <div
                  key={sdg.id}
                  onClick={() => handleToggleSdg(sdg.id)}
                  style={{
                    position: 'relative',
                    background: isActive ? 'rgba(161, 244, 200, 0.2)' : '#ffffff',
                    border: isActive ? '2px solid #116c4a' : '1px solid #E9ECEF',
                    borderRadius: 12, padding: 16,
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    display: 'flex', flexDirection: 'column', minHeight: 160
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
                    background: isActive ? meta.color : `${meta.color}1A`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 12, transition: 'all 0.2s ease'
                  }}>
                    <Icon size={24} style={{ color: isActive ? '#ffffff' : meta.color }} />
                  </div>
                  <p style={{
                    fontSize: 12, fontWeight: 700, letterSpacing: '0.03em',
                    color: isActive ? '#116c4a' : '#414844',
                    margin: '0 0 4px 0', textTransform: 'uppercase'
                  }}>
                    GOAL {String(meta.number).padStart(2, '0')}
                  </p>
                  <p style={{
                    fontSize: 14, color: '#191c1d', margin: 0,
                    lineHeight: '18px'
                  }}>
                    {meta.title}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Assessment: Assessor + Evidence */}
          <div className="stat-card" style={{
            marginTop: 24, padding: 24,
            border: '2px solid #2D6A4F'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <ShieldCheck size={20} style={{ color: '#012d1d' }} />
              <h4 style={{ fontSize: 16, fontWeight: 700, color: '#012d1d', margin: 0 }}>
                Detail Assessment
              </h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#414844',
                  marginBottom: 8
                }}>
                  <User size={14} /> Diases oleh
                </label>
                <input
                  type="text"
                  value={assessedBy}
                  onChange={(e) => setAssessedBy(e.target.value)}
                  placeholder="Nama orang yang mengurus/menilai SDGs perusahaan ini"
                  style={{
                    width: '100%', padding: '12px 14px', border: '1px solid #E9ECEF',
                    borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit',
                    boxSizing: 'border-box', background: '#ffffff'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#414844',
                  marginBottom: 8
                }}>
                  <Upload size={14} /> Bukti Pendukung
                </label>
                <input
                  type="file"
                  id="assessment-evidence"
                  accept="image/*,.doc,.docx,.pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    handleUploadEvidence(e.target.files[0]);
                    e.target.value = '';
                  }}
                />
                <label htmlFor="assessment-evidence" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '12px 14px', border: '1px dashed #116c4a', borderRadius: 8,
                  fontSize: 13, fontWeight: 600, color: '#116c4a', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.6)'
                }}>
                  <Upload size={16} />
                  {uploading ? 'Uploading...' : evidenceFile ? 'Ganti Bukti (gambar/Word)' : 'Upload Bukti (gambar/Word)'}
                </label>
              </div>
            </div>

            {evidenceFile && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', background: '#f8f9fa',
                  border: '1px solid #E9ECEF', borderRadius: 8
                }}>
                  {IMAGE_EXTENSIONS.includes(evidenceFile.file_type) ? (
                    <img src={formatUrl(evidenceFile.file_url)} alt="bukti"
                      style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                  ) : (
                    <FileText size={28} style={{ color: '#2D6A4F', flexShrink: 0 }} />
                  )}
                  <a
                    href={formatUrl(evidenceFile.file_url)}
                    target="_blank"
                    rel="noreferrer"

                    style={{ flex: 1, minWidth: 0, textDecoration: 'none', color: '#191c1d', fontSize: 13, fontWeight: 500 }}
                  >
                    Bukti Assessment
                  </a>
                  <button
                    onClick={handleDeleteEvidence}
                    title="Hapus bukti"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D90429', padding: 4, flexShrink: 0 }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sticky Bottom Actions */}
      {company && (
        <div className="stat-card" style={{
          padding: '16px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2D6A4F', fontSize: 12 }}>
            <Info size={16} />
            <span>{selectedSdgs.length} SDG dipilih untuk perusahaan ini.</span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '12px 32px', border: 'none', borderRadius: 8,
              fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
              color: '#ffffff', background: '#012d1d', cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s ease',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            {saving ? 'Saving...' : (
              <><Send size={16} /> SAVE ASSESSMENT</>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminTraceability;
