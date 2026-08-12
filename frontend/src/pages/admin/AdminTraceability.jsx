import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ChevronRight, CircleDollarSign, UtensilsCrossed, Heart,
  BookOpen, UserCheck, Droplets, Zap, Briefcase, Cog, Scale,
  Building2, Recycle, Globe, Fish, TreePine, Gavel, Handshake,
  Send, Info, CheckCircle, MapPin, Search, ChevronDown, X, Upload,
  FileText, Trash2, User, ShieldCheck, FolderOpen, BadgeCheck
} from 'lucide-react';
import api from '../../shared/api/axios';

const SDG_META = [
  { goal_number: 1, name: 'No Poverty', color: '#E5243B', icon: CircleDollarSign },
  { goal_number: 2, name: 'Zero Hunger', color: '#DDA63A', icon: UtensilsCrossed },
  { goal_number: 3, name: 'Good Health & Well-being', color: '#4C9F38', icon: Heart },
  { goal_number: 4, name: 'Quality Education', color: '#C5192D', icon: BookOpen },
  { goal_number: 5, name: 'Gender Equality', color: '#FF3A21', icon: UserCheck },
  { goal_number: 6, name: 'Clean Water & Sanitation', color: '#26BDE2', icon: Droplets },
  { goal_number: 7, name: 'Affordable & Clean Energy', color: '#FCC30B', icon: Zap },
  { goal_number: 8, name: 'Decent Work & Economic Growth', color: '#A21942', icon: Briefcase },
  { goal_number: 9, name: 'Industry, Innovation & Infrastructure', color: '#FD6925', icon: Cog },
  { goal_number: 10, name: 'Reduced Inequalities', color: '#DD1367', icon: Scale },
  { goal_number: 11, name: 'Sustainable Cities & Communities', color: '#FD9D24', icon: Building2 },
  { goal_number: 12, name: 'Responsible Consumption & Production', color: '#BF8B2E', icon: Recycle },
  { goal_number: 13, name: 'Climate Action', color: '#3F7E44', icon: Globe },
  { goal_number: 14, name: 'Life Below Water', color: '#0A97D9', icon: Fish },
  { goal_number: 15, name: 'Life on Land', color: '#56C02B', icon: TreePine },
  { goal_number: 16, name: 'Peace, Justice & Strong Institutions', color: '#00689D', icon: Gavel },
  { goal_number: 17, name: 'Partnerships for the Goals', color: '#19486A', icon: Handshake },
];

const getSdgMeta = (goalNumber) => SDG_META.find(m => m.goal_number === goalNumber)
  || { goal_number: goalNumber, name: `Goal ${goalNumber}`, color: '#6C757D', icon: Building2 };

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api$/, '') || '';

const fmtDate = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const AdminTraceability = () => {
  const [searchParams] = useSearchParams();
  const qCompanyId = searchParams.get('company_id');
  const qProjectId = searchParams.get('project_id');

  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [company, setCompany] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [project, setProject] = useState(null);

  const [sdgs, setSdgs] = useState([]);
  const [selectedSdgs, setSelectedSdgs] = useState([]);
  const [assessedBy, setAssessedBy] = useState('');
  const [verification, setVerification] = useState(null);
  const [latestAssessment, setLatestAssessment] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const loadProjectSdg = async (projectId) => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.get(`/assessment/projects/${projectId}/project-sdgs`);
      if (res.data.success) {
        const d = res.data.data;
        setProject(d.project);
        setSdgs(d.sdgs || []);
        setSelectedSdgs((d.sdgs || []).filter(s => s.selected).map(s => s.id));
        setAssessedBy(d.verification?.assessed_by || '');
        setVerification(d.verification || null);
        setLatestAssessment(d.latest_assessment || null);
      } else {
        setFeedback({ type: 'error', text: res.data.message });
      }
    } catch (error) {
      setFeedback({ type: 'error', text: error.response?.data?.message || 'Gagal memuat data SDG project' });
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async (companyId, autoProjectId) => {
    setProjectsLoading(true);
    setProjects([]);
    try {
      const r = await api.get(`/admin/companies/${companyId}/projects`);
      if (r.data.success) {
        setProjects(r.data.data);
        if (autoProjectId && r.data.data.some(p => p.id === autoProjectId)) {
          setSelectedProjectId(autoProjectId);
          loadProjectSdg(autoProjectId);
        }
      }
    } catch (e) {
      setFeedback({ type: 'error', text: e.response?.data?.message || 'Gagal memuat daftar project' });
    } finally {
      setProjectsLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const res = await api.get('/admin/companies');
      if (res.data.success) {
        setCompanies(res.data.data);
        const found = res.data.data.find(c => c.id === qCompanyId);
        if (found) {
          setSelectedCompanyId(qCompanyId);
          setCompany(found);
          loadProjects(qCompanyId, qProjectId);
        }
      }
    } catch (error) {
      console.error('Gagal mengambil daftar company', error);
    } finally {
      setCompaniesLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setSelectedProjectId(null);
    setProject(null);
    setSdgs([]);
    setSelectedSdgs([]);
    setAssessedBy('');
    setVerification(null);
    setLatestAssessment(null);
    setDropdownOpen(false);
    setSearchQuery('');
    setFeedback(null);
    loadProjects(companyId);
  };

  const handleClearCompany = () => {
    setSelectedCompanyId(null);
    setCompany(null);
    setProjects([]);
    setSelectedProjectId(null);
    setProject(null);
    setSdgs([]);
    setSelectedSdgs([]);
    setAssessedBy('');
    setVerification(null);
    setLatestAssessment(null);
    setFeedback(null);
  };

  const handleSelectProject = async (projectId) => {
    setSelectedProjectId(projectId);
    loadProjectSdg(projectId);
  };

  const handleToggleSdg = (sdgId) => {
    setSelectedSdgs(prev =>
      prev.includes(sdgId)
        ? prev.filter(id => id !== sdgId)
        : [...prev, sdgId]
    );
  };

  const applyRecommendation = () => {
    if (!latestAssessment?.results?.length) return;
    const metGoals = new Set(latestAssessment.results.filter(r => r.is_met).map(r => r.goal_number));
    const ids = sdgs.filter(s => metGoals.has(s.goal_number)).map(s => s.id);
    setSelectedSdgs(ids);
    setFeedback({ type: 'success', text: `Rekomendasi diterapkan: ${ids.length} SDG tercentang.` });
  };

  const handleUploadEvidence = async (file) => {
    if (!file || !selectedProjectId) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post(`/assessment/projects/${selectedProjectId}/project-sdgs/verification/evidence`, formData, {
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
    if (!selectedProjectId) return;
    try {
      const res = await api.delete(`/assessment/projects/${selectedProjectId}/project-sdgs/verification/evidence`);
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
    if (!selectedProjectId) return;
    setSaving(true);
    try {
      const res = await api.put(`/assessment/projects/${selectedProjectId}/project-sdgs`, {
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
          <p className="page-description">
            Pilih project, centang SDG yang dikontribusikan berdasarkan hasil questionnaire, isi asesor, lalu lampirkan bukti.
          </p>
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
      <div ref={dropdownRef} style={{ position: 'relative', marginBottom: 16 }}>
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
              <span style={{ fontSize: 14, color: '#6C757D' }}>Pilih perusahaan...</span>
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

      {/* Project Selector */}
      {company && (
        <div className="stat-card" style={{ padding: 20, marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#414844', marginBottom: 8, display: 'block' }}>
            <FolderOpen size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> Project (setiap project punya satu sistem traceability)
          </label>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <select
              value={selectedProjectId || ''}
              onChange={(e) => handleSelectProject(e.target.value)}
              disabled={projectsLoading}
              style={{
                flex: 1, padding: '12px 14px', border: '1px solid #E9ECEF', borderRadius: 8,
                fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                background: '#ffffff', color: '#191c1d'
              }}
            >
              <option value="">{projectsLoading ? 'Memuat project...' : 'Pilih project...'}</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.commodity ? ` (${p.commodity})` : ''}</option>)}
            </select>
          </div>
        </div>
      )}

      {!company ? (
        <div style={{
          textAlign: 'center', padding: '80px 24px',
          border: '2px dashed #E9ECEF', borderRadius: 12,
          marginBottom: 24
        }}>
          <Building2 size={48} style={{ color: '#c1c8c2', marginBottom: 16 }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#414844', margin: '0 0 8px 0' }}>
            Pilih Perusahaan & Project
          </h3>
          <p style={{ fontSize: 14, color: '#6C757D', margin: 0 }}>
            Pilih perusahaan, lalu pilih project yang sudah diisi questionnaire-nya.
          </p>
        </div>
      ) : !selectedProjectId ? (
        <div style={{
          textAlign: 'center', padding: '60px 24px',
          border: '2px dashed #E9ECEF', borderRadius: 12,
          marginBottom: 24
        }}>
          <FolderOpen size={40} style={{ color: '#c1c8c2', marginBottom: 12 }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#414844', margin: '0 0 6px 0' }}>
            Pilih Project
          </h3>
          <p style={{ fontSize: 13, color: '#6C757D', margin: 0 }}>
            Project yang sudah dinilai akan menampilkan hasil questionnaire sebagai panduan checklist.
          </p>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', marginBottom: 24, color: '#6C757D' }}>
          Memuat data assessment...
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          {/* Project Detail */}
          {project && (
            <div className="stat-card" style={{
              padding: 24, marginBottom: 20,
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
                    {project.name}
                  </h2>
                  <div style={{ fontSize: 14, color: '#6C757D' }}>
                    {project.company_name || ''} {project.commodity ? `• ${project.commodity}` : ''}
                  </div>
                  {project.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6C757D', marginTop: 4 }}>
                      <MapPin size={13} /> {project.location}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 32 }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: '#6C757D', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
                    SDG Dipilih
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

          {/* Guidance from latest assessment */}
          {latestAssessment && (
            <div className="stat-card" style={{ padding: 20, marginBottom: 20, border: '2px solid #2D6A4F', background: 'rgba(161,244,200,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <ShieldCheck size={20} style={{ color: '#012d1d' }} />
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#012d1d', margin: 0 }}>Informasi Hasil Questionnaire</h4>
                <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: '#6C757D' }}>
                  {fmtDate(latestAssessment.completed_at)}
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#6C757D', margin: '0 0 12px 0' }}>
                {latestAssessment.questionnaire_name || 'Questionnaire'} • Dinilai oleh {latestAssessment.assessor_name || '-'} •
                SDG mencapai threshold: <b style={{ color: '#116c4a' }}>{latestAssessment.met_count}/{latestAssessment.assessed_count}</b>
              </p>
              {latestAssessment.results?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {latestAssessment.results.map(r => {
                    const meta = getSdgMeta(r.goal_number);
                    return (
                      <span key={r.goal_number} title={`Score ${Math.round(r.score)}% / Threshold ${Math.round(r.threshold)}%`} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px',
                        borderRadius: 9999, fontSize: 11, fontWeight: 700,
                        background: r.is_met ? `${meta.color}1A` : '#f1f3f5',
                        border: r.is_met ? `1px solid ${meta.color}55` : '1px solid #E9ECEF',
                        color: r.is_met ? meta.color : '#9aa0a6'
                      }}>
                        <meta.icon size={13} /> GOAL {String(r.goal_number).padStart(2, '0')} {Math.round(r.score)}%
                      </span>
                    );
                  })}
                </div>
              )}
              <button onClick={applyRecommendation} style={{
                padding: '9px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                letterSpacing: '0.05em', color: '#012d1d', background: '#ffffff',
                border: '1px solid #012d1d', cursor: 'pointer', fontFamily: 'inherit',
                display: 'inline-flex', alignItems: 'center', gap: 8
              }}>
                <BadgeCheck size={15} /> Gunakan Rekomendasi (centang SDG yang lolos threshold)
              </button>
            </div>
          )}

          {/* SDGs Framework Alignment */}
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
              {sdgs.map(sdg => {
                const meta = getSdgMeta(sdg.goal_number);
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
                      GOAL {String(meta.goal_number).padStart(2, '0')}
                    </p>
                    <p style={{
                      fontSize: 14, color: '#191c1d', margin: 0,
                      lineHeight: '18px'
                    }}>
                      {meta.name}
                    </p>
                    <p style={{ fontSize: 11, color: '#6C757D', margin: '6px 0 0 0' }}>
                      Threshold {Math.round(sdg.threshold || 70)}%
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
                    placeholder="Nama orang yang mengurus/menilai SDGs project ini"
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
                      <img src={`${BASE_URL}${evidenceFile.file_url}`} alt="bukti"
                        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                    ) : (
                      <FileText size={28} style={{ color: '#2D6A4F', flexShrink: 0 }} />
                    )}
                    <a
                      href={`${BASE_URL}${evidenceFile.file_url}`}
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

          {/* Sticky Bottom Actions */}
          <div className="stat-card" style={{
            padding: '16px 24px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2D6A4F', fontSize: 12 }}>
              <Info size={16} />
              <span>{selectedSdgs.length} SDG dipilih untuk project ini.</span>
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
        </div>
      )}
    </div>
  );
};

export default AdminTraceability;
