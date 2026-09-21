import { useEffect, useState, useRef, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ChevronRight, Building2,
  CheckCircle, MapPin, Search, ChevronDown, X, Upload,
  FileText, Trash2, User, ShieldCheck, FolderOpen, BadgeCheck,
  Lock, Save, AlertTriangle, Check
} from 'lucide-react';
import api from '../../shared/api/axios';
import { AuthContext } from '../../features/auth/AuthContext';
import { getSdgMeta } from '../../shared/constants/sdg';
import { fmtDate } from '../../shared/utils/date';

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api$/, '') || '';

const SDG_STATUS_META = {
  FULFILLED: { color: '#2D6A4F', label: 'FULFILLED' },
  CONTRIBUTING: { color: '#b45309', label: 'CONTRIBUTING' },
  LOW_CONTRIBUTION: { color: '#b91c1c', label: 'LOW CONTRIBUTION' },
  NOT_ASSESSED: { color: '#6C757D', label: 'NOT ASSESSED' },
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
  const [verification, setVerification] = useState(null);
  const [savedSelection, setSavedSelection] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [latestAssessment, setLatestAssessment] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user } = useContext(AuthContext);

  // URL file: MinIO mengembalikan absolute URL, penyimpanan lokal relative (/static/...)
  const absoluteFileUrl = (url) => {
    if (!url) return '#';
    if (/^https?:\/\//i.test(url)) return url;
    return `${BASE_URL}${url}`;
  };

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
        setSavedSelection((d.sdgs || []).filter(s => s.selected).map(s => s.id));
        setVerification(d.verification || null);
        setAssessments(d.assessments || []);
        setSelectedAssessmentId(d.selected_assessment_id || null);
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
    setSavedSelection([]);
    setVerification(null);
    setEditMode(false);
    setLatestAssessment(null);
    setAssessments([]);
    setSelectedAssessmentId(null);
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
    setSavedSelection([]);
    setVerification(null);
    setEditMode(false);
    setLatestAssessment(null);
    setAssessments([]);
    setSelectedAssessmentId(null);
    setFeedback(null);
  };

  const handleSelectProject = async (projectId) => {
    setSelectedProjectId(projectId);
    loadProjectSdg(projectId);
  };

  const handleToggleSdg = (sdgId) => {
    if (!canEdit) return;
    setSelectedSdgs(prev =>
      prev.includes(sdgId)
        ? prev.filter(id => id !== sdgId)
        : [...prev, sdgId]
    );
  };

  const handleSelectAssessment = async (assessmentId) => {
    if (!assessmentId || assessmentId === selectedAssessmentId) return;
    setSelectedAssessmentId(assessmentId);
    if (assessmentId === latestAssessment?.id) return;
    try {
      const res = await api.get(`/assessment/assessments/${assessmentId}`);
      if (res.data.success) {
        const d = res.data.data;
        const results = (d.sdg_results || []).map(r => ({
          goal_number: r.goal_number,
          name: r.name,
          score: r.score,
          threshold: r.threshold,
          is_met: r.is_met,
        }));
        setLatestAssessment({
          id: d.assessment.id,
          questionnaire_name: d.assessment.questionnaire_name,
          questionnaire_version: d.assessment.questionnaire_version,
          completed_at: d.assessment.completed_at,
          assessor_name: d.assessment.assessor_name,
          results,
          assessed_count: results.length,
          met_count: results.filter(r => r.is_met).length,
        });
      } else {
        setFeedback({ type: 'error', text: res.data.message });
      }
    } catch (error) {
      setFeedback({ type: 'error', text: error.response?.data?.message || 'Gagal memuat assessment terpilih' });
    }
  };

  const applyRecommendation = () => {
    if (!latestAssessment?.results?.length) return;
    const metGoals = new Set(latestAssessment.results.filter(r => r.is_met).map(r => r.goal_number));
    const ids = sdgs.filter(s => metGoals.has(s.goal_number)).map(s => s.id);
    setSelectedSdgs(ids);
    setFeedback({ type: 'success', text: `Rekomendasi diterapkan: ${ids.length} SDG tercentang.` });
  };

  const handleUploadEvidence = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length || !selectedProjectId) return;
    setUploading(true);
    let okCount = 0;
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await api.post(`/assessment/projects/${selectedProjectId}/project-sdgs/verification/evidence`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
          setVerification(res.data.data);
          okCount += 1;
        } else {
          setFeedback({ type: 'error', text: res.data.message });
        }
      } catch (error) {
        setFeedback({ type: 'error', text: error.response?.data?.message || 'Gagal upload bukti' });
      }
    }
    if (okCount > 0) {
      setFeedback({ type: 'success', text: `${okCount} bukti ditambahkan — tekan "Simpan Perubahan" untuk finalisasi.` });
    }
    setUploading(false);
  };

  const handleDeleteEvidence = async (evidenceId) => {
    if (!selectedProjectId || !evidenceId) return;
    try {
      const res = await api.delete(`/assessment/projects/${selectedProjectId}/project-sdgs/verification/evidence/${evidenceId}`);
      if (res.data.success) {
        setVerification(res.data.data);
        setFeedback({ type: 'success', text: 'File bukti dihapus — tekan "Simpan Perubahan" untuk finalisasi.' });
      } else {
        setFeedback({ type: 'error', text: res.data.message });
      }
    } catch (error) {
      setFeedback({ type: 'error', text: error.response?.data?.message || 'Gagal menghapus bukti' });
    }
  };

  const handleSave = async () => {
    if (!selectedProjectId) return;
    setConfirmOpen(false);
    setSaving(true);
    try {
      const res = await api.put(`/assessment/projects/${selectedProjectId}/project-sdgs`, {
        sdgs: selectedSdgs.map((sdgId, index) => ({ sdg_id: sdgId, display_order: index })),
        assessment_id: selectedAssessmentId
      });
      if (res.data.success) {
        if (res.data.data?.verification) setVerification(res.data.data.verification);
        setSavedSelection(selectedSdgs);
        setEditMode(false);
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

  const evidences = verification?.evidences || [];
  const savedState = verification?.save_state || 'unsaved';
  const hasUnsavedChanges = savedState === 'unsaved';
  const hasLocalChanges = selectedSdgs.join(',') !== savedSelection.join(',');
  const showSaveButton = hasUnsavedChanges || hasLocalChanges;
  const canEdit = editMode || showSaveButton;

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

      {/* Company & Project Selectors - Side by Side */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        {/* Company Selector */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: '#414844', marginBottom: 6, display: 'block', textTransform: 'uppercase' }}>
            Company
          </label>
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '9px 16px', minHeight: 58, boxSizing: 'border-box',
              border: '1px solid #E9ECEF',
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
                    <div style={{ fontSize: 11, color: '#6C757D' }}>{company.subscription_plan || 'Select company'}</div>
                  </div>
                </div>
              ) : (
                <span style={{ fontSize: 14, color: '#6C757D' }}>Select company...</span>
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
                  placeholder="Search company..."
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
                    Company not found
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
          <div style={{ position: 'relative' }}>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: '#414844', marginBottom: 6, display: 'block', textTransform: 'uppercase' }}>
              Project
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', top: 12, left: 16, width: 32, height: 32,
                borderRadius: 6, background: '#c1ecd4', pointerEvents: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <FolderOpen size={16} style={{ color: '#012d1d' }} />
              </div>
              <select
                value={selectedProjectId || ''}
                onChange={(e) => handleSelectProject(e.target.value)}
                disabled={projectsLoading}
                style={{
                  width: '100%', height: 58, padding: '0 40px 0 60px',
                  border: '1px solid #E9ECEF', borderRadius: 8,
                  fontSize: 14, fontWeight: 600, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                  background: '#ffffff', color: '#191c1d', cursor: projectsLoading ? 'not-allowed' : 'pointer',
                  opacity: projectsLoading ? 0.6 : 1, appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none'
                }}
              >
                <option value="">{projectsLoading ? 'Loading projects...' : 'Select project...'}</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.commodity ? ` (${p.commodity})` : ''}</option>)}
              </select>
              <ChevronDown size={18} style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                color: '#6C757D', pointerEvents: 'none'
              }} />
            </div>
          </div>
        )}
      </div>

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
            <div style={{
              padding: '20px 24px', marginBottom: 20,
              background: '#ffffff', border: '1px solid #E9ECEF', borderRadius: 12,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              gap: 24, flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', minWidth: 0 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 12,
                  background: '#c1ecd4', overflow: 'hidden', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <FolderOpen size={26} style={{ color: '#012d1d' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{
                    fontSize: 18, fontWeight: 700, color: '#191c1d', margin: 0,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {project.name}
                  </h2>
                  <div style={{ fontSize: 13, color: '#6C757D', marginTop: 2 }}>
                    {project.company_name || ''}{project.commodity ? ` • ${project.commodity}` : ''}
                  </div>
                  {project.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6C757D', marginTop: 3 }}>
                      <MapPin size={12} style={{ flexShrink: 0 }} />
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project.location}</span>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ padding: '0 24px', borderLeft: '1px solid #E9ECEF' }}>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', color: '#6C757D', textTransform: 'uppercase', margin: '0 0 4px 0', textAlign: 'center' }}>
                    SDG Dipilih
                  </p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#191c1d', margin: 0, textAlign: 'center' }}>
                    {selectedSdgs.length} <span style={{ color: '#6C757D', fontWeight: 500 }}>dari {sdgs.length}</span>
                  </p>
                </div>
                <div style={{ padding: '0 24px', borderLeft: '1px solid #E9ECEF' }}>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', color: '#6C757D', textTransform: 'uppercase', margin: '0 0 4px 0', textAlign: 'center' }}>
                    Verifikasi
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center' }}>
                    <CheckCircle size={14} style={{ color: verification?.assessed_by && evidences.length > 0 ? '#2D6A4F' : '#9ca3af' }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: verification?.assessed_by && evidences.length > 0 ? '#2D6A4F' : '#6C757D' }}>
                      {verification?.assessed_by && evidences.length > 0 ? 'Lengkap' : 'Belum Lengkap'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sumber assessment (questionnaire ke-N) yang dipilih admin */}
          {latestAssessment && (
            <div className="stat-card" style={{ padding: 20, marginBottom: 20, border: '1px solid #E9ECEF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <ShieldCheck size={20} style={{ color: '#116c4a' }} />
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#012d1d', margin: 0 }}>Sumber Assessment</h4>
                <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: '#6C757D' }}>
                  {fmtDate(latestAssessment.completed_at)}
                </span>
              </div>

              {assessments.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: '#414844', marginBottom: 6, display: 'block', textTransform: 'uppercase' }}>
                    Pilih Questionnaire
                  </label>
                  <select
                    value={selectedAssessmentId || ''}
                    onChange={(e) => handleSelectAssessment(e.target.value)}
                    disabled={!canEdit}
                    style={{
                      width: '100%', padding: '10px 12px', border: '1px solid #E9ECEF', borderRadius: 8,
                      fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box',
                      background: canEdit ? '#ffffff' : '#F8F9FA', color: canEdit ? '#191c1d' : '#6C757D',
                      cursor: canEdit ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {assessments.map((a, idx) => (
                      <option key={a.id} value={a.id}>
                        {`#${assessments.length - idx} • ${a.questionnaire_name || 'Questionnaire'}${a.questionnaire_version ? ` v${a.questionnaire_version}` : ''} • ${fmtDate(a.completed_at)} • ${a.met_count}/${a.assessed_count} SDG lolos`}
                      </option>
                    ))}
                  </select>
                  {assessments.length > 1 && (
                    <p style={{ fontSize: 12, color: '#6C757D', margin: '6px 0 0 0' }}>
                      Questionnaire dapat dijalankan berkali-kali — pilih hasil keberapa yang menjadi dasar SDG project ini.
                    </p>
                  )}
                </div>
              )}
              <p style={{ fontSize: 13, color: '#414844', margin: '0 0 16px 0', lineHeight: '1.6' }}>
                <span style={{ fontWeight: 600 }}>{latestAssessment.questionnaire_name || 'Questionnaire'}</span> •
                Dinilai oleh <span style={{ fontWeight: 600 }}>{latestAssessment.assessor_name || '-'}</span> •
                <span style={{ marginLeft: 4, fontWeight: 700, color: '#116c4a' }}>
                  {latestAssessment.met_count}/{latestAssessment.assessed_count} SDG lolos threshold
                </span>
              </p>

              {latestAssessment.results?.filter(r => r.is_met).length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: '#6C757D', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
                    Lolos Threshold
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {latestAssessment.results.filter(r => r.is_met).map(r => {
                      const meta = getSdgMeta(r.goal_number);
                      return (
                        <span key={r.goal_number} title={`${Math.round(r.score)}% / Threshold ${Math.round(r.threshold)}%`} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px',
                          borderRadius: 8, fontSize: 12, fontWeight: 700,
                          background: `${meta.color}15`,
                          border: `1px solid ${meta.color}40`,
                          color: meta.color
                        }}>
                          GOAL {String(r.goal_number).padStart(2, '0')}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <button onClick={applyRecommendation} style={{
                width: '100%', padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 700,
                letterSpacing: '0.05em', color: '#ffffff', background: '#116c4a',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.target.style.background = '#0d4a2f'; }}
              onMouseLeave={(e) => { e.target.style.background = '#116c4a'; }}
              >
                <BadgeCheck size={16} /> Apply Recommendation
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
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 16
            }}>
              {sdgs.map(sdg => {
                const meta = getSdgMeta(sdg.goal_number);
                const isActive = selectedSdgs.includes(sdg.id);
                const Icon = meta.icon;
                const showThreshold = sdg.threshold && Math.round(sdg.threshold) !== 70;
                return (
                  <div
                    key={sdg.id}
                    onClick={() => handleToggleSdg(sdg.id)}
                    style={{
                      background: '#ffffff',
                      border: isActive ? '2px solid #116c4a' : '1px solid #E9ECEF',
                      borderRadius: 12,
                      cursor: canEdit ? 'pointer' : 'default', transition: 'all 0.2s ease',
                      display: 'flex', flexDirection: 'column', minHeight: 220,
                      position: 'relative', overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.borderColor = '#b6cec1';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.borderColor = '#E9ECEF';
                    }}
                  >
                    {/* Top Section: Icon with colored background */}
                    <div style={{
                      flex: '0 0 130px',
                      background: isActive ? meta.color : `${meta.color}1A`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}>
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => {}}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: 'absolute', top: 10, right: 10,
                          width: 20, height: 20, borderRadius: 4,
                          accentColor: '#116c4a', cursor: 'pointer'
                        }}
                      />
                      <div style={{
                        width: 90, height: 90, borderRadius: 12,
                        background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden'
                      }}>
                        {sdg.image_url ? (
                          <img
                            src={sdg.image_url}
                            alt={`SDG ${sdg.goal_number}`}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        ) : (
                          <Icon size={48} style={{ color: isActive ? '#ffffff' : meta.color }} />
                        )}
                      </div>
                    </div>

                    {/* Bottom Section: Text */}
                    <div style={{
                      flex: 1,
                      padding: '14px 12px',
                      display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
                      alignItems: 'center'
                    }}>
                      <p style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.03em',
                        color: '#6C757D',
                        margin: '0 0 4px 0', textTransform: 'uppercase'
                      }}>
                        GOAL {String(meta.goal_number).padStart(2, '0')}
                      </p>
                      <p style={{
                        fontSize: 13, color: '#191c1d', margin: 0,
                        lineHeight: '16px', textAlign: 'center', fontWeight: 600
                      }}>
                        {meta.name}
                      </p>
                      {showThreshold && (
                        <p style={{ fontSize: 9, color: '#6C757D', margin: '6px 0 0 0', textAlign: 'center' }}>
                          Threshold {Math.round(sdg.threshold)}%
                        </p>
                      )}
                      {sdg.assessment_result && (() => {
                        const st = SDG_STATUS_META[sdg.assessment_result.status] || SDG_STATUS_META.NOT_ASSESSED;
                        return (
                          <span
                            title={`Skor ${Math.round(sdg.assessment_result.score)}% / Threshold ${Math.round(sdg.assessment_result.threshold)}%`}
                            style={{
                              marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                              background: `${st.color}15`, color: st.color,
                              border: `1px solid ${st.color}40`
                            }}
                          >
                            {Math.round(sdg.assessment_result.score)}% · {st.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Assessment: Assessor + Evidence */}
            <div className="stat-card" style={{
              marginTop: 24, padding: 24,
              border: '1px solid #E9ECEF'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <ShieldCheck size={20} style={{ color: '#116c4a' }} />
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#012d1d', margin: 0 }}>
                  Assessment Details & Verification
                </h4>
              </div>

              {/* Assessor (locked: username superadmin) */}
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#414844',
                  marginBottom: 8, textTransform: 'uppercase'
                }}>
                  <User size={14} /> Nama Assessor
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={verification?.assessed_by || user?.full_name || user?.username || ''}
                    readOnly
                    style={{
                      width: '100%', padding: '12px 38px 12px 14px', border: '1px solid #E9ECEF',
                      borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit',
                      boxSizing: 'border-box', background: '#F8F9FA', color: '#414844',
                      cursor: 'not-allowed'
                    }}
                  />
                  <Lock size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#6C757D' }} />
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#6C757D' }}>
                  Nama assessor otomatis dari akun Anda dan tidak dapat diubah.
                </p>
              </div>

              {/* Evidence Upload */}
              <div>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#414844',
                  marginBottom: 8, textTransform: 'uppercase'
                }}>
                  <Upload size={14} /> Supporting Evidence
                </label>
                <input
                  type="file"
                  id="assessment-evidence"
                  multiple
                  accept="image/*,.doc,.docx,.pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    handleUploadEvidence(e.target.files);
                    e.target.value = '';
                  }}
                />
                <label htmlFor="assessment-evidence" style={{
                  display: canEdit ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '16px 14px', border: '2px dashed #116c4a', borderRadius: 8,
                  fontSize: 14, fontWeight: 600, color: '#116c4a', cursor: 'pointer',
                  background: 'rgba(17, 108, 58, 0.03)', transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(17, 108, 58, 0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(17, 108, 58, 0.03)'; }}
                >
                  <Upload size={18} />
                  {uploading ? 'Uploading...' : 'Tambah Bukti (image/Word/PDF)'}
                </label>

                {/* Evidence List (multi-file) */}
                {evidences.map((ev) => (
                  <div key={ev.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', background: '#f8f9fa',
                    border: '1px solid #E9ECEF', borderRadius: 8, marginTop: 12
                  }}>
                    {IMAGE_EXTENSIONS.includes(ev.file_type) ? (
                      <img src={absoluteFileUrl(ev.file_url)} alt={ev.original_name || 'bukti'}
                        style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                    ) : (
                      <FileText size={32} style={{ color: '#116c4a', flexShrink: 0 }} />
                    )}
                    <a
                      href={absoluteFileUrl(ev.file_url)}
                      target="_blank"
                      rel="noreferrer"
                      title={ev.original_name || 'Buka dokumen'}
                      style={{ flex: 1, minWidth: 0, textDecoration: 'none', color: '#116c4a', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {ev.original_name || `${(ev.file_type || 'FILE').toUpperCase()} Document`}
                    </a>
                    <button
                      onClick={() => handleDeleteEvidence(ev.id)}
                      title="Hapus file bukti"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba1a1a', padding: 4, flexShrink: 0, fontSize: 16, display: canEdit ? 'block' : 'none' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Bottom Actions */}
          <div style={{
            position: 'sticky', bottom: 0, left: 0, right: 0,
            padding: '16px 24px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            gap: 16, background: '#ffffff',
            border: '1px solid #E9ECEF', borderRadius: 12, marginTop: 24,
            boxShadow: '0 -4px 12px rgba(0,0,0,0.05)', zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#414844', fontSize: 13, fontWeight: 500 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: showSaveButton ? '#b45309' : '#2D6A4F'
                }} />
                {showSaveButton ? 'Ada perubahan belum disimpan' : 'Semua perubahan tersimpan'}
              </span>
              <span style={{ color: '#E9ECEF' }}>|</span>
              <span>{selectedSdgs.length} SDG selected</span>
              <span style={{ color: '#E9ECEF' }}>|</span>
              <span>{evidences.length > 0 ? `✓ ${evidences.length} bukti terlampir` : '○ Belum ada bukti'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {showSaveButton ? (
                <button
                  onClick={() => setConfirmOpen(true)}
                  disabled={saving}
                  style={{
                    padding: '12px 28px', border: 'none', borderRadius: 8,
                    fontSize: 13, fontWeight: 700, letterSpacing: '0.03em',
                    color: '#ffffff', background: '#116c4a', cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
                    opacity: saving ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => { if (!saving) e.target.style.background = '#0d4a2f'; }}
                  onMouseLeave={(e) => { if (!saving) e.target.style.background = '#116c4a'; }}
                >
                  {saving ? 'Menyimpan...' : (<><Save size={16} /> SIMPAN PERUBAHAN</>)}
                </button>
              ) : (
                <button
                  onClick={() => setEditMode((v) => !v)}
                  disabled={saving}
                  title="Klik lagi untuk mengubah SDG atau menambah bukti"
                  style={{
                    padding: '12px 28px', border: '1px solid #2D6A4F', borderRadius: 8,
                    fontSize: 13, fontWeight: 700, letterSpacing: '0.03em',
                    color: '#2D6A4F', background: 'rgba(45, 106, 79, 0.06)', cursor: saving ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0
                  }}
                  onMouseEnter={(e) => { if (!saving) e.target.style.background = 'rgba(45, 106, 79, 0.12)'; }}
                  onMouseLeave={(e) => { if (!saving) e.target.style.background = 'rgba(45, 106, 79, 0.06)'; }}
                >
                  <Check size={16} /> {editMode ? 'MODE EDIT' : 'TERSIMPAN'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Simpan (pengaman sebelum finalisasi) */}
      {confirmOpen && (
        <div
          onClick={() => !saving && setConfirmOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(1, 45, 29, 0.45)', backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 460, background: '#ffffff', borderRadius: 12,
              border: '1px solid #E9ECEF', boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
              padding: 24, fontFamily: 'inherit'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: 'rgba(180, 83, 9, 0.10)', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <AlertTriangle size={20} style={{ color: '#b45309' }} />
              </div>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#012d1d' }}>
                Simpan perubahan?
              </h4>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: 14, color: '#414844', lineHeight: 1.6 }}>
              Perubahan berikut akan difinalisasi untuk project{' '}
              <strong style={{ color: '#012d1d' }}>{project?.name || 'ini'}</strong>:
            </p>
            <ul style={{ margin: '0 0 20px', paddingLeft: 20, fontSize: 13, color: '#414844', lineHeight: 1.9 }}>
              <li>{selectedSdgs.length} SDG terpilih (sumber: assessment terpilih di dropdown)</li>
              <li>{evidences.length} file bukti pendukung terlampir</li>
              <li>Assessor: <strong>{verification?.assessed_by || user?.username || '-'}</strong></li>
            </ul>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={saving}
                style={{
                  padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: '1px solid #E9ECEF', background: '#ffffff', color: '#414844',
                  cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit'
                }}
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  border: 'none', background: '#116c4a', color: '#ffffff',
                  cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 8,
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? 'Menyimpan...' : (<><Save size={15} /> Ya, Simpan</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTraceability;
