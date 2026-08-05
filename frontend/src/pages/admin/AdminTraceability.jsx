import { useEffect, useState, useRef } from 'react';
import {
  ChevronRight, CircleDollarSign, UtensilsCrossed, Heart,
  BookOpen, UserCheck, Droplets, Zap, Briefcase, Cog, Scale,
  Building2, Recycle, Globe, Fish, TreePine, Gavel, Handshake,
  Send, Info, Save, CheckCircle, MapPin, Sprout,
  Search, ChevronDown, X, ArrowLeftRight, Upload, FileText, Trash2, User, ShieldCheck
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

const AdminTraceability = () => {
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [company, setCompany] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [project, setProject] = useState(null);
  const [assessmentLoading, setAssessmentLoading] = useState(false);

  const [selectedSdgs, setSelectedSdgs] = useState([]);
  const [assessedBy, setAssessedBy] = useState('');
  const [status, setStatus] = useState('draft');
  const [evidence, setEvidence] = useState([]);

  const [saving, setSaving] = useState(false);
  const [saveType, setSaveType] = useState(null);
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
    setProject(null);
    resetAssessment();
    setProjects([]);
    setDropdownOpen(false);
    setSearchQuery('');
    setFeedback(null);
    setProjectsLoading(true);
    try {
      const res = await api.get(`/admin/companies/${companyId}/projects`);
      if (res.data.success) setProjects(res.data.data);
    } catch (error) {
      console.error('Gagal mengambil project', error);
    } finally {
      setProjectsLoading(false);
    }
  };

  const resetAssessment = () => {
    setSelectedSdgs([]);
    setAssessedBy('');
    setStatus('draft');
    setEvidence([]);
  };

  const handleSelectProject = async (projectId) => {
    const p = projects.find(x => x.id === projectId) || null;
    setProject(p);
    setAssessmentLoading(true);
    resetAssessment();
    try {
      const res = await api.get(`/admin/traceability/${projectId}`);
      if (res.data.success) {
        const d = res.data.data;
        setSelectedSdgs(d.sdgs || []);
        setAssessedBy(d.assessment?.assessed_by || '');
        setStatus(d.assessment?.status || 'draft');
        setEvidence(d.assessment?.evidence || []);
      } else {
        setFeedback({ type: 'error', text: res.data.message });
      }
    } catch (error) {
      setFeedback({ type: 'error', text: error.response?.data?.message || 'Gagal memuat assessment' });
    } finally {
      setAssessmentLoading(false);
    }
  };

  const handleChangeProject = () => {
    setProject(null);
    resetAssessment();
    setFeedback(null);
  };

  const handleToggleSdg = (number) => {
    setSelectedSdgs(prev =>
      prev.includes(number)
        ? prev.filter(n => n !== number)
        : [...prev, number]
    );
  };

  const handleUploadEvidence = async (file) => {
    if (!file || !project) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post(`/admin/traceability/${project.id}/evidence`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setEvidence(prev => [...prev, res.data.data]);
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

  const handleDeleteEvidence = async (evId) => {
    try {
      const res = await api.delete(`/admin/traceability/evidence/${evId}`);
      if (res.data.success) {
        setEvidence(prev => prev.filter(e => e.id !== evId));
        setFeedback({ type: 'success', text: res.data.message });
      } else {
        setFeedback({ type: 'error', text: res.data.message });
      }
    } catch (error) {
      setFeedback({ type: 'error', text: error.response?.data?.message || 'Gagal menghapus bukti' });
    }
  };

  const handleSave = async (type) => {
    if (!project) return;
    setSaving(true);
    setSaveType(type);
    try {
      const res = await api.put(`/admin/traceability/${project.id}`, {
        sdg_numbers: selectedSdgs,
        assessed_by: assessedBy,
        status: type
      });
      if (res.data.success) {
        const d = res.data.data;
        setStatus(d.assessment?.status || type);
        setEvidence(d.assessment?.evidence || []);
        setFeedback({ type: 'success', text: res.data.message });
      } else {
        setFeedback({ type: 'error', text: res.data.message });
      }
    } catch (error) {
      setFeedback({ type: 'error', text: error.response?.data?.message || 'Gagal menyimpan assessment' });
    } finally {
      setSaving(false);
      setSaveType(null);
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
          <p className="page-description">Centang SDG yang dikontribusikan project, lalu isi asesor dan lampirkan bukti.</p>
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
              onClick={(e) => { e.stopPropagation(); setSelectedCompanyId(null); setCompany(null); setProject(null); setProjects([]); resetAssessment(); }}
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

      {/* Company Detail (when selected) */}
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
              {project && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 13, fontWeight: 600, color: '#116c4a',
                    background: '#a1f4c8', padding: '4px 12px', borderRadius: 9999
                  }}>
                    <Sprout size={14} /> Project: {project.name}
                  </span>
                  <button
                    onClick={handleChangeProject}
                    title="Kembali ke daftar project"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '4px 12px', border: '1px solid #E9ECEF', borderRadius: 9999,
                      fontSize: 12, fontWeight: 600, color: '#414844', background: '#ffffff',
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease'
                    }}
                  >
                    <ArrowLeftRight size={13} /> Ganti Project
                  </button>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 32 }}>
            {project && project.commodity && (
              <>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: '#6C757D', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
                    Commodity
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#191c1d', margin: 0 }}>
                    {project.commodity}
                  </p>
                </div>
                <div style={{ width: 1, background: '#E9ECEF', alignSelf: 'stretch' }} />
              </>
            )}
            {project && project.location && (
              <>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: '#6C757D', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
                    Location
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#191c1d', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={14} /> {project.location}
                  </p>
                </div>
                <div style={{ width: 1, background: '#E9ECEF', alignSelf: 'stretch' }} />
              </>
            )}
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: '#6C757D', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
                Status
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                <CheckCircle size={14} style={{ color: status === 'published' ? '#2D6A4F' : '#6C757D' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: status === 'published' ? '#2D6A4F' : '#6C757D' }}>
                  {status === 'published' ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Selector */}
      {company && !project && (
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: 18, fontWeight: 700, color: '#012d1d', margin: '0 0 12px 0' }}>
            Pilih Project
          </h4>

          {projectsLoading ? (
            <div style={{ padding: '24px', color: '#6C757D' }}>Memuat project...</div>
          ) : projects.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '48px 24px',
              border: '2px dashed #E9ECEF', borderRadius: 12, color: '#6C757D'
            }}>
              Belum ada project untuk perusahaan ini.
            </div>
          ) : (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 16
            }}>
              {projects.map(p => (
                <div
                  key={p.id}
                  onClick={() => handleSelectProject(p.id)}
                  style={{
                    background: '#ffffff', border: '1px solid #E9ECEF', borderRadius: 12,
                    padding: 16, cursor: 'pointer', transition: 'all 0.2s ease',
                    display: 'flex', flexDirection: 'column', gap: 8
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2D6A4F'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E9ECEF'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Sprout size={18} style={{ color: '#2D6A4F' }} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#191c1d' }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: '#6C757D' }}>
                    {[p.commodity, p.location].filter(Boolean).join(' · ') || '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
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
            Gunakan pencarian di atas untuk memilih perusahaan, lalu project yang akan dinilai SDGs-nya.
          </p>
        </div>
      ) : !project ? (
        <div style={{
          textAlign: 'center', padding: '60px 24px', marginBottom: 24,
          border: '2px dashed #E9ECEF', borderRadius: 12, color: '#6C757D'
        }}>
          <Sprout size={40} style={{ color: '#c1c8c2', marginBottom: 12 }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#414844', margin: '0 0 8px 0' }}>
            Pilih Project
          </h3>
          <p style={{ fontSize: 14, color: '#6C757D', margin: 0 }}>
            Setelah memilih perusahaan, pilih project untuk menilai SDGs-nya.
          </p>
        </div>
      ) : assessmentLoading ? (
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
                Centang SDG yang dikontribusikan oleh project ini.
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

          {/* Assessment: Assessor + Evidence (di atas tombol save/publish) */}
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
                  placeholder="Nama orang yang mengurus/menilai SDGs ini"
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
                  {uploading ? 'Uploading...' : 'Upload Bukti (gambar/Word)'}
                </label>
              </div>
            </div>

            {evidence.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                {evidence.map(ev => {
                  const isImg = IMAGE_EXTENSIONS.includes(ev.file_type);
                  return (
                    <div key={ev.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', background: '#f8f9fa',
                      border: '1px solid #E9ECEF', borderRadius: 8
                    }}>
                      {isImg ? (
                        <img src={`${BASE_URL}${ev.file_url}`} alt={ev.file_name}
                          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                      ) : (
                        <FileText size={28} style={{ color: '#2D6A4F', flexShrink: 0 }} />
                      )}
                      <a
                        href={`${BASE_URL}${ev.file_url}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ flex: 1, minWidth: 0, textDecoration: 'none', color: '#191c1d', fontSize: 13, fontWeight: 500 }}
                      >
                        {ev.file_name}
                      </a>
                      <button
                        onClick={() => handleDeleteEvidence(ev.id)}
                        title="Hapus bukti"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D90429', padding: 4, flexShrink: 0 }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sticky Bottom Actions */}
      {company && project && (
        <div className="stat-card" style={{
          padding: '16px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2D6A4F', fontSize: 12 }}>
            <Info size={16} />
            <span>{selectedSdgs.length} SDG dipilih untuk project ini.</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
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
              {saving && saveType === 'draft' ? 'Saving...' : (
                <><Save size={16} /> SAVE DRAFT</>
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
              {saving && saveType === 'publish' ? 'Publishing...' : (
                <><Send size={16} /> PUBLISH ASSESSMENT</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTraceability;
