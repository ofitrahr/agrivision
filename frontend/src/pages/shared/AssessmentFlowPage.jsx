import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, Building2, FolderOpen, Play, Send,
  CheckCircle2, XCircle, MinusCircle, ChevronDown,
  Loader2, Info, FileText, CalendarDays, User, BadgeCheck
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import api from '../../shared/api/axios';
import { getSdgMeta } from '../../shared/constants/sdg';
import { fmtDate } from '../../shared/utils/date';

const STATUS_META = {
  'Terpenuhi': { text: 'Terpenuhi', bg: '#116c4a', icon: CheckCircle2 },
  'Belum Terpenuhi': { text: 'Belum Terpenuhi', bg: '#B45309', icon: XCircle },
  'Tidak Dinilai': { text: 'Tidak Dinilai', bg: '#6C757D', icon: MinusCircle },
};

const StatusBadge = ({ status }) => {
  const m = STATUS_META[status] || STATUS_META['Tidak Dinilai'];
  const Icon = m.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px',
      borderRadius: 9999, background: m.bg, color: '#ffffff',
      fontSize: 11, fontWeight: 700, letterSpacing: '0.03em', whiteSpace: 'nowrap'
    }}>
      <Icon size={12} /> {m.text}
    </span>
  );
};

const InfoField = ({ icon, label, value }) => (
  <div>
    <div style={{
      fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: '#6C757D',
      textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4
    }}>
      {icon} {label}
    </div>
    <div style={{ fontSize: 14, fontWeight: 600, color: '#191c1d' }}>{value}</div>
  </div>
);

const StatCard = ({ label, value, sub, color }) => (
  <div className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
    <div style={{
      fontSize: 12, fontWeight: 600, color: '#6C757D', letterSpacing: '0.05em',
      textTransform: 'uppercase', marginBottom: 6
    }}>
      {label}
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1.2, marginBottom: 4 }}>{value}</div>
    <div style={{ fontSize: 12, color: '#6C757D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
  </div>
);

const statusText = (status) => {
  const map = {
    completed: 'Selesai',
    in_progress: 'Berlangsung',
    draft: 'Draf',
    cancelled: 'Dibatalkan',
  };
  return map[status] || status || '-';
};

const AssessmentFlowPage = ({ role = 'manager' }) => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectInfo, setProjectInfo] = useState(null);

  const [questionnaire, setQuestionnaire] = useState(null);
  const [assessmentId, setAssessmentId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [sdgResults, setSdgResults] = useState([]);
  const [allSdgs, setAllSdgs] = useState([]);
  const [assessmentMeta, setAssessmentMeta] = useState(null);
  const [expandedGoals, setExpandedGoals] = useState([]);
  const [answersDetail, setAnswersDetail] = useState(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [step, setStep] = useState('project'); // project | form | result

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [respondentName, setRespondentName] = useState('');

  useEffect(() => {
    if (role === 'admin') {
      api.get('/admin/companies').then(r => {
        if (r.data.success) setCompanies(r.data.data);
      }).catch(() => {});
    }
  }, [role]);

  const loadProjects = async (companyId) => {
    setSelectedCompanyId(companyId);
    setSelectedProjectId('');
    setProjects([]);
    try {
      const r = await api.get(`/admin/companies/${companyId}/projects`);
      if (r.data.success) setProjects(r.data.data);
    } catch (e) { setFeedback({ type: 'error', text: e.response?.data?.message || 'Gagal memuat project' }); }
  };

  const handleSelectProject = async (projectId) => {
    setSelectedProjectId(projectId);
    setLoading(true);
    setFeedback(null);
    try {
      const r = await api.get(`/assessment/projects/${projectId}/traceability`);
      if (r.data.success) setProjectInfo(r.data.data);
    } catch (e) {
      setFeedback({ type: 'error', text: e.response?.data?.message || 'Gagal memuat data project' });
    } finally { setLoading(false); }
  };

  const startAssessment = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    setFeedback(null);
    try {
      // ambil questionnaire aktif
      let qid = null;
      const qr = await api.get('/assessment/questionnaires/active');
      if (qr.data.success && qr.data.data) {
        qid = qr.data.data.id;
        setQuestionnaire(qr.data.data);
      }
      const r = await api.post(`/assessment/projects/${selectedProjectId}/assessments`, {
        questionnaire_id: qid,
        respondent_id: null,
        assessor_name: respondentName || undefined
      });
      if (r.data.success) {
        setAssessmentId(r.data.data.id);
        setAnswers({});
        setSdgResults([]);
        setAllSdgs([]);
        setAssessmentMeta(null);
        setStep('form');
      } else {
        setFeedback({ type: 'error', text: r.data.message });
      }
    } catch (e) {
      setFeedback({ type: 'error', text: e.response?.data?.message || 'Gagal memulai assessment' });
    } finally { setLoading(false); }
  };

  const handleAnswer = (questionId, type, optionId) => {
    setAnswers(prev => {
      if (type === 'multiple_choice') {
        const existing = prev[questionId] || { option_ids: [] };
        const has = existing.option_ids.includes(optionId);
        return {
          ...prev,
          [questionId]: {
            option_ids: has
              ? existing.option_ids.filter(id => id !== optionId)
              : [...existing.option_ids, optionId]
          }
        };
      }
      return { ...prev, [questionId]: { option_id: optionId } };
    });
  };

  const submitAnswers = async (finalize) => {
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        answers: Object.entries(answers).map(([qid, val]) => ({
          question_id: qid,
          option_ids: val.option_ids || [],
          option_id: val.option_id
        })),
        status: finalize ? 'completed' : 'in_progress'
      };
      const res = await api.post(`/assessment/assessments/${assessmentId}/answers`, payload);
      if (res.data.success) {
        setSdgResults(res.data.data.sdg_results || []);
        setAllSdgs(res.data.data.all_sdgs || []);
        setAssessmentMeta(res.data.data.assessment || null);
        if (finalize) setStep('result');
        else setFeedback({ type: 'success', text: 'Draf jawaban tersimpan' });
      } else {
        setFeedback({ type: 'error', text: res.data.message });
      }
    } catch (e) {
      setFeedback({ type: 'error', text: e.response?.data?.message || 'Gagal menyimpan jawaban' });
    } finally { setSaving(false); }
  };

  const resetFlow = () => {
    setStep('project');
    setQuestionnaire(null);
    setAssessmentId(null);
    setAnswers({});
    setSdgResults([]);
    setAllSdgs([]);
    setAssessmentMeta(null);
    setExpandedGoals([]);
    setAnswersDetail(null);
    setShowAnswers(false);
    setFeedback(null);
  };

  const buildResultRows = () => {
    const byGoal = {};
    (sdgResults || []).forEach(r => { byGoal[r.goal_number] = r; });
    const rows = (allSdgs && allSdgs.length ? allSdgs : Object.values(byGoal)).map(s => {
      const res = byGoal[s.goal_number];
      const meta = getSdgMeta(s.goal_number);
      return {
        goal_number: s.goal_number,
        name: s.name || meta.name,
        description: s.description || null,
        meta,
        result: res || null,
        score: res ? res.score : null,
        threshold: res ? res.threshold : (s.threshold != null ? s.threshold : 70),
        is_met: res ? res.is_met : false,
        is_assessed: !!res,
      };
    });
    const assessed = rows.filter(r => r.is_assessed).sort((a, b) => (b.score - a.score) || (a.goal_number - b.goal_number));
    const unassessed = rows.filter(r => !r.is_assessed).sort((a, b) => a.goal_number - b.goal_number);
    return {
      rows: [...assessed, ...unassessed],
      assessed,
      unassessed,
      assessedCount: assessed.length,
      unassessedCount: unassessed.length,
    };
  };

  const toggleExpand = (goal) => {
    setExpandedGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
  };

  const loadAnswers = async () => {
    if (answersDetail) { setShowAnswers(!showAnswers); return; }
    try {
      const r = await api.get(`/assessment/assessments/${assessmentId}`);
      if (r.data.success) {
        setAnswersDetail(r.data.data.answers || []);
        setShowAnswers(true);
      }
    } catch (e) {
      setFeedback({ type: 'error', text: e.response?.data?.message || 'Gagal memuat jawaban' });
    }
  };

  const openExistingAssessment = async (assessmentId) => {
    setLoading(true);
    setFeedback(null);
    try {
      const r = await api.get(`/assessment/assessments/${assessmentId}`);
      if (r.data.success) {
        const d = r.data.data;
        setAssessmentId(assessmentId);
        setQuestionnaire(d.questionnaire || null);
        setSdgResults(d.sdg_results || []);
        setAllSdgs(d.all_sdgs || []);
        setAssessmentMeta(d.assessment || null);
        setProjectInfo({
          project: {
            id: d.assessment?.project_id,
            name: d.assessment?.project_name,
            company_name: null,
            company_id: null,
          }
        });
        setExpandedGoals([]);
        setAnswersDetail(null);
        setShowAnswers(false);
        setStep('result');
      } else {
        setFeedback({ type: 'error', text: r.data.message });
      }
    } catch (e) {
      setFeedback({ type: 'error', text: e.response?.data?.message || 'Gagal memuat hasil assessment' });
    } finally {
      setLoading(false);
    }
  };

  const navigateToTraceability = () => {
    const pid = projectInfo?.project?.id || assessmentMeta?.project_id;
    const cid = projectInfo?.project?.company_id;
    const params = new URLSearchParams();
    if (pid) params.set('project_id', pid);
    if (cid) params.set('company_id', cid);
    const qs = params.toString();
    navigate(`/admin/traceability${qs ? `?${qs}` : ''}`);
  };

  const crumbs = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#6C757D', marginBottom: 8 }}>
      <span>{role === 'admin' ? 'Admin' : 'Dashboard'}</span>
      <ChevronRight size={14} />
      <span>Traceability</span>
      <ChevronRight size={14} />
      <span style={{ color: '#012d1d' }}>SDG Assessment</span>
    </div>
  );

  return (
    <div style={{ paddingBottom: 100 }}>
      <div className="page-header">
        <div>
          {crumbs}
          <h1 className="page-title" style={{ margin: 0 }}>Digital SDG Assessment</h1>
          <p className="page-description">
            Admin mengisi questionnaire berdasarkan wawancara dengan Manager. Sistem menghitung SDG via scoring & threshold.
          </p>
        </div>
      </div>

      {feedback && (
        <div style={{
          padding: '12px 16px', borderRadius: 8, marginBottom: 20,
          background: feedback.type === 'success' ? '#a1f4c8' : '#fecaca',
          color: feedback.type === 'success' ? '#1b724f' : '#991b1b', fontSize: 14, fontWeight: 500
        }}>
          {feedback.text}
        </div>
      )}

      {/* -------- STEP: PROJECT SELECTION -------- */}
      {step === 'project' && (
        <div className="stat-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <FolderOpen size={20} style={{ color: '#012d1d' }} />
            <h4 style={{ fontSize: 16, fontWeight: 700, color: '#012d1d', margin: 0 }}>Pilih Project</h4>
          </div>

          {role === 'admin' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#414844', marginBottom: 8, display: 'block' }}>
                <Building2 size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> Perusahaan
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => loadProjects(e.target.value)}
                style={inputStyle}
              >
                <option value="">Pilih perusahaan...</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#414844', marginBottom: 8, display: 'block' }}>
            Project (setiap project memiliki satu sistem traceability)
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => handleSelectProject(e.target.value)}
            style={inputStyle}
          >
            <option value="">{role === 'admin' && !selectedCompanyId ? 'Pilih perusahaan dahulu' : 'Pilih project...'}</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.commodity ? ` (${p.commodity})` : ''}</option>)}
          </select>

          {projectInfo && (
            <div style={{
              marginTop: 16, padding: 16, background: '#f8f9fa', border: '1px solid #E9ECEF',
              borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#191c1d' }}>
                  {projectInfo.project.name}
                </div>
                <div style={{ fontSize: 13, color: '#6C757D' }}>
                  {projectInfo.project.company_name} • {projectInfo.project.commodity || '-'} • {projectInfo.project.location || '-'}
                </div>
                <div style={{ fontSize: 12, color: '#2D6A4F', marginTop: 6 }}>
                  SDG terpenuhi saat ini: {projectInfo.project_sdgs.length} • Assessment: {projectInfo.assessments.length}
                </div>
              </div>
              <button onClick={startAssessment} disabled={loading} style={primaryBtn}>
                {loading ? <Loader2 size={16} className="spin" /> : <Play size={16} />} Mulai Assessment
              </button>
            </div>
          )}

          {projectInfo?.project_sdgs?.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <strong style={{ fontSize: 13, color: '#414844' }}>SDG Project (hasil checklist traceability):</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {projectInfo.project_sdgs.map(ps => {
                  const meta = getSdgMeta(ps.goal_number);
                  const Icon = meta.icon;
                  return (
                    <span key={ps.id} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                      background: `${meta.color}14`, color: meta.color, borderRadius: 9999, fontSize: 12, fontWeight: 600
                    }}>
                      <Icon size={14} /> GOAL {String(ps.goal_number).padStart(2, '0')} • {ps.name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {projectInfo?.assessments?.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <FileText size={18} style={{ color: '#012d1d' }} />
                <strong style={{ fontSize: 14, color: '#012d1d' }}>Riwayat Assessment</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {projectInfo.assessments.map(a => {
                  const isCompleted = a.status === 'completed';
                  return (
                    <div key={a.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', border: '1px solid #E9ECEF', borderRadius: 8,
                      background: isCompleted ? '#ffffff' : '#f8f9fa'
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#191c1d' }}>
                          {a.questionnaire || 'Questionnaire'} {a.questionnaire_version ? `(v${a.questionnaire_version})` : ''}
                        </div>
                        <div style={{ fontSize: 12, color: '#6C757D', marginTop: 2 }}>
                          {statusText(a.status)} • {fmtDate(a.completed_at || a.started_at)}
                          {a.assessor_name ? ` • ${a.assessor_name}` : ''}
                        </div>
                      </div>
                      {isCompleted ? (
                        <button onClick={() => openExistingAssessment(a.id)} style={secondaryBtn}>
                          <FileText size={14} /> Lihat Hasil
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: '#9aa0a6', fontWeight: 600 }}>Belum selesai</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: 12, color: '#6C757D', marginTop: 10, marginBottom: 0 }}>
                Klik "Lihat Hasil" untuk membuka kembali informasi SDG dari assessment yang sudah selesai.
              </p>
            </div>
          )}
        </div>
      )}

      {/* -------- STEP: QUESTIONNAIRE FORM -------- */}
      {step === 'form' && questionnaire && (
        <div>
          <div className="stat-card" style={{ padding: 24, marginBottom: 20, border: '2px solid #2D6A4F' }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: 20, fontWeight: 700, color: '#012d1d' }}>
              {questionnaire.name}
            </h4>
            <div style={{ fontSize: 13, color: '#6C757D' }}>Versi {questionnaire.version} • {questionnaire.description}</div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6C757D', display: 'block', marginBottom: 4 }}>
                  ASSESSOR (ADMIN)
                </label>
                <input
                  value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  placeholder="Nama admin"
                  style={{ ...inputStyle, margin: 0 }}
                />
              </div>
            </div>
          </div>

          {questionnaire.sections.map(section => (
            <div key={section.id} className="stat-card" style={{ padding: 24, marginBottom: 20 }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: '#012d1d', margin: '0 0 4px 0' }}>
                {section.name}
              </h4>
              {section.description && <p style={{ fontSize: 13, color: '#6C757D', margin: '0 0 16px 0' }}>{section.description}</p>}

              {section.questions.map((question, qi) => {
                const current = answers[question.id];
                const isMulti = question.question_type === 'multiple_choice';
                return (
                  <div key={question.id} style={{
                    padding: '16px 0', borderTop: '1px solid #E9ECEF'
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#191c1d', marginBottom: 12 }}>
                      <span style={{ color: '#2D6A4F', marginRight: 8 }}>Q{qi + 1}.</span>
                      {question.question_text}
                      <span style={{ fontSize: 10, color: '#6C757D', fontWeight: 500, marginLeft: 8 }}>
                        [{isMulti ? 'pilih beberapa' : 'pilih satu'}]
                      </span>
                      {question.sdg_mappings?.length > 0 && (
                        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {question.sdg_mappings.map(m => {
                            const meta = getSdgMeta(m.goal_number);
                            return (
                              <span key={m.sdg_id} style={{
                                fontSize: 10, padding: '2px 8px', borderRadius: 9999,
                                background: `${meta.color}18`, color: meta.color, fontWeight: 600
                              }}>
                                SDG {String(m.goal_number).padStart(2, '0')} {Math.round(m.weight)}%
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {question.options.map(opt => {
                        const isSelected = isMulti
                          ? (current?.option_ids || []).includes(opt.id)
                          : current?.option_id === opt.id;
                        return (
                          <label key={opt.id} style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                            border: isSelected ? '2px solid #116c4a' : '1px solid #E9ECEF',
                            background: isSelected ? 'rgba(161,244,200,0.2)' : '#ffffff',
                            borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s ease'
                          }}>
                            <input
                              type={isMulti ? 'checkbox' : 'radio'}
                              checked={isSelected}
                              onChange={() => handleAnswer(question.id, question.question_type, opt.id)}
                              style={{ accentColor: '#116c4a', width: 16, height: 16 }}
                            />
                            <span style={{ flex: 1, fontSize: 14, color: '#191c1d' }}>{opt.option_text}</span>
                            <span style={{ fontSize: 11, color: '#6C757D', fontWeight: 600 }}>({Math.round(opt.score)})</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          <div className="stat-card" style={{
            padding: '16px 24px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', boxShadow: '0 -4px 20px rgba(0,0,0,0.04)'
          }}>
            <span style={{ fontSize: 13, color: '#6C757D' }}>
              {Object.keys(answers).length}/{questionnaire.sections.reduce((a, s) => a + s.questions.length, 0)} pertanyaan terjawab
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => submitAnswers(false)} disabled={saving} style={secondaryBtn}>
                {saving ? 'Menyimpan...' : 'Simpan Draf'}
              </button>
              <button onClick={() => submitAnswers(true)} disabled={saving} style={primaryBtn}>
                {saving ? <Loader2 size={16} className="spin" /> : <Send size={16} />} Submit & Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------- STEP: SDG ASSESSMENT RESULT -------- */}
      {step === 'result' && (() => {
        const { rows, assessed, assessedCount, unassessedCount } = buildResultRows();
        const metCount = assessed.filter(r => r.is_met).length;
        const notMetCount = assessedCount - metCount;
        const avgScore = assessedCount ? Math.round(assessed.reduce((a, r) => a + r.score, 0) / assessedCount) : 0;
        const top = assessed.length ? assessed[0] : null;
        const meta = assessmentMeta || {};
        const defaultThreshold = assessed[0]?.threshold ?? 70;
        const donutData = [
          { name: 'Terpenuhi', value: metCount, color: '#2D6A4F' },
          { name: 'Belum Terpenuhi', value: notMetCount, color: '#B45309' },
        ];
        const hasDonut = metCount + notMetCount > 0;
        const metSdgs = assessed.filter(r => r.is_met);

        return (
          <div>
            {/* Assessment Info */}
            <div className="stat-card" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <CheckCircle2 size={20} style={{ color: '#116c4a' }} />
                <h4 style={{ fontSize: 18, fontWeight: 700, color: '#012d1d', margin: 0 }}>Hasil Assessment SDG</h4>
                <span style={{ marginLeft: 'auto', padding: '5px 10px', borderRadius: 9999, background: '#2D6A4F14', color: '#012d1d', fontSize: 11, fontWeight: 700, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                  {statusText(meta.status)}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <InfoField icon={<FolderOpen size={14} />} label="Project" value={projectInfo?.project?.name || meta.project_name || '-'} />
                <InfoField icon={<Building2 size={14} />} label="Perusahaan" value={projectInfo?.project?.company_name || '-'} />
                <InfoField icon={<FileText size={14} />} label="Questionnaire" value={meta.questionnaire_name ? `${meta.questionnaire_name} (v${meta.questionnaire_version})` : (questionnaire ? `${questionnaire.name} (v${questionnaire.version})` : '-')} />
                <InfoField icon={<CalendarDays size={14} />} label="Tanggal Selesai" value={fmtDate(meta.completed_at)} />
                <InfoField icon={<User size={14} />} label="Assessor" value={meta.assessor_name || respondentName || '-'} />
                <InfoField icon={<BadgeCheck size={14} />} label="Status" value={statusText(meta.status)} />
              </div>
            </div>

            {/* Summary */}
            <div className="stats-grid" style={{ marginBottom: 20 }}>
              <StatCard label="SDG Terpenuhi" value={`${metCount}/${assessedCount}`} sub={`${unassessedCount} SDG tidak dinilai`} color="#116c4a" />
              <StatCard label="Belum Terpenuhi" value={`${notMetCount}`} sub={`dari ${assessedCount} SDG dinilai`} color="#B45309" />
              <StatCard label="Rata-rata Score" value={`${avgScore}%`} sub="SDG yang dinilai" color="#012d1d" />
              <StatCard label="Score Tertinggi" value={top ? `${Math.round(top.score)}%` : '-'} sub={top ? `GOAL ${String(top.goal_number).padStart(2, '0')} ${top.name}` : '-'} color="#2D6A4F" />
            </div>

            {/* SDG Score Overview */}
            <div className="stat-card" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h4 style={{ fontSize: 18, fontWeight: 700, color: '#012d1d', margin: '0 0 4px 0' }}>Score SDG</h4>
                  <p style={{ fontSize: 13, color: '#6C757D', margin: 0 }}>
                    Diurutkan dari skor tertinggi. Garis vertikal di bar = threshold ({Math.round(defaultThreshold)}%).
                  </p>
                </div>
                {hasDonut && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 84, height: 84 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={donutData} dataKey="value" innerRadius={26} outerRadius={40} paddingAngle={2} strokeWidth={0}>
                            {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#191c1d', lineHeight: 1.1 }}>{metCount}/{assessedCount}</div>
                      <div style={{ fontSize: 12, color: '#6C757D' }}>SDG terpenuhi</div>
                    </div>
                  </div>
                )}
              </div>

              {rows.map(r => {
                const Icon = r.meta.icon;
                return (
                  <div key={r.goal_number} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: '1px solid #E9ECEF' }}>
                    <div style={{ width: 230, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <span style={{ width: 34, height: 34, borderRadius: 8, background: r.is_met ? '#116c4a' : '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={18} style={{ color: r.is_met ? '#ffffff' : '#6C757D' }} />
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#414844', letterSpacing: '0.03em' }}>GOAL {String(r.goal_number).padStart(2, '0')}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#191c1d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                      </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ position: 'relative', height: 18, background: '#EDF0F2', borderRadius: 9999 }}>
                        {r.is_assessed && (
                          <div style={{ width: `${Math.min(r.score, 100)}%`, height: '100%', background: r.is_met ? '#2D6A4F' : '#B45309', borderRadius: 9999 }} />
                        )}
                        {r.is_assessed && (
                          <div style={{ position: 'absolute', left: `${r.threshold}%`, top: -3, bottom: -3, width: 2, background: '#191c1d', borderRadius: 1, transform: 'translateX(-1px)' }} title={`Threshold ${Math.round(r.threshold)}%`} />
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9aa0a6', marginTop: 2 }}>
                        <span>0%</span><span>50%</span><span>100%</span>
                      </div>
                    </div>

                    <div style={{ width: 120, flexShrink: 0, textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: r.is_assessed ? '#191c1d' : '#9aa0a6' }}>
                        {r.is_assessed ? `${Math.round(r.score)}%` : '—'}
                      </div>
                      <div style={{ fontSize: 11, color: '#6C757D' }}>
                        {r.is_assessed ? `Threshold ${Math.round(r.threshold)}%` : 'belum dinilai'}
                      </div>
                    </div>

                    <div style={{ width: 140, flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
                      <StatusBadge status={r.is_assessed ? (r.is_met ? 'Terpenuhi' : 'Belum Terpenuhi') : 'Tidak Dinilai'} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detail SDG Result */}
            <div className="stat-card" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Info size={20} style={{ color: '#012d1d' }} />
                <h4 style={{ fontSize: 18, fontWeight: 700, color: '#012d1d', margin: 0 }}>Detail Hasil SDG</h4>
              </div>
              <p style={{ fontSize: 13, color: '#6C757D', margin: '0 0 16px 0' }}>
                Klik baris untuk melihat faktor/pertanyaan yang memengaruhi score.
              </p>

              {rows.map(r => {
                const Icon = r.meta.icon;
                const expanded = expandedGoals.includes(r.goal_number);
                return (
                  <div key={r.goal_number} style={{ border: '1px solid #E9ECEF', borderRadius: 10, marginBottom: 10, overflow: 'hidden' }}>
                    <div
                      onClick={() => toggleExpand(r.goal_number)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer', background: expanded ? '#f8faf9' : '#ffffff', transition: 'background 0.15s ease' }}
                    >
                      <span style={{ width: 36, height: 36, borderRadius: 8, background: r.is_met ? '#116c4a' : '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={18} style={{ color: r.is_met ? '#ffffff' : '#6C757D' }} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#191c1d' }}>
                          GOAL {String(r.goal_number).padStart(2, '0')} — {r.name}
                        </div>
                        <div style={{ fontSize: 12, color: '#6C757D' }}>
                          {r.is_assessed ? `Score ${Math.round(r.score)}% • Threshold ${Math.round(r.threshold)}%` : 'Belum ada pertanyaan yang memetakan SDG ini pada questionnaire.'}
                        </div>
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        <StatusBadge status={r.is_assessed ? (r.is_met ? 'Terpenuhi' : 'Belum Terpenuhi') : 'Tidak Dinilai'} />
                      </div>
                      <ChevronDown size={18} style={{ color: '#6C757D', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease', flexShrink: 0 }} />
                    </div>

                    {expanded && (
                      <div style={{ padding: '16px 18px', borderTop: '1px solid #E9ECEF', background: '#ffffff' }}>
                        {r.description && <p style={{ fontSize: 13, color: '#414844', margin: '0 0 14px 0', lineHeight: 1.5 }}>{r.description}</p>}

                        <div style={{ marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#414844' }}>Score vs Threshold</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: r.is_assessed ? '#191c1d' : '#9aa0a6' }}>
                              {r.is_assessed ? `${Math.round(r.score)}% / ${Math.round(r.threshold)}%` : '—'}
                            </span>
                          </div>
                          <div style={{ position: 'relative', height: 14, background: '#EDF0F2', borderRadius: 9999 }}>
                            {r.is_assessed && <div style={{ width: `${Math.min(r.score, 100)}%`, height: '100%', background: r.is_met ? '#2D6A4F' : '#B45309', borderRadius: 9999 }} />}
                            {r.is_assessed && <div style={{ position: 'absolute', left: `${r.threshold}%`, top: -2, bottom: -2, width: 2, background: '#191c1d' }} />}
                          </div>
                          {r.is_assessed && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                              <span style={{ fontSize: 11, color: '#6C757D' }}>
                                Delta: {r.score >= r.threshold ? '+' : ''}{Math.round(r.score - r.threshold)}% terhadap threshold
                              </span>
                              <span style={{ fontSize: 11, color: '#6C757D' }}>Threshold {Math.round(r.threshold)}%</span>
                            </div>
                          )}
                        </div>

                        {r.is_assessed && (
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#414844', marginBottom: 8 }}>Faktor yang memengaruhi score:</div>
                            {r.result?.contributions?.length ? (
                              r.result.contributions.map((c, i) => (
                                <div key={c.question_id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderTop: '1px solid #F1F3F5', alignItems: 'center' }}>
                                  <span style={{ width: 26, height: 26, borderRadius: 6, background: '#2D6A4F14', color: '#116c4a', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>Q{i + 1}</span>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, color: '#191c1d', lineHeight: 1.4 }}>{c.question_text}</div>
                                    <div style={{ fontSize: 11, color: '#6C757D', marginTop: 2 }}>
                                      Jawaban score {Math.round(c.score)}% • Weight {Math.round(c.weight_pct)}%
                                    </div>
                                  </div>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: '#116c4a', flexShrink: 0 }}>+{Math.round(c.contribution)} poin</span>
                                </div>
                              ))
                            ) : (
                              <div style={{ fontSize: 12, color: '#9aa0a6' }}>Tidak ada kontribusi tercatat.</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Next step: determine Project SDG on Traceability */}
            <div className="stat-card" style={{ padding: 24, marginBottom: 20, border: '2px solid #2D6A4F' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <BadgeCheck size={20} style={{ color: '#116c4a' }} />
                <h4 style={{ fontSize: 18, fontWeight: 700, color: '#012d1d', margin: 0 }}>Langkah Berikutnya: Tentukan SDG Project</h4>
              </div>
              <p style={{ fontSize: 13, color: '#6C757D', margin: '0 0 12px 0' }}>
                Halaman ini hanya menampilkan hasil penilaian (score). SDG yang benar-benar menjadi <b>SDG Project</b> ditentukan
                oleh Admin melalui checklist di menu Traceability berdasarkan informasi di atas.
              </p>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#414844', marginBottom: 8 }}>
                  Rekomendasi SDG (score ≥ threshold {Math.round(defaultThreshold)}%):
                </div>
                {metSdgs.length ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {metSdgs.map(r => {
                      const Icon = r.meta.icon;
                      return (
                        <span key={r.goal_number} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                          borderRadius: 9999, background: '#2D6A4F14', border: '1px solid #2D6A4F40',
                          color: '#116c4a', fontSize: 12, fontWeight: 700
                        }}>
                          <Icon size={16} /> GOAL {String(r.goal_number).padStart(2, '0')} • {r.name} <span style={{ color: '#6C757D', fontWeight: 600 }}>({Math.round(r.score)}%)</span>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#9aa0a6' }}>Tidak ada SDG yang mencapai threshold pada assessment ini.</div>
                )}
              </div>
              {role === 'admin' && (
                <button onClick={navigateToTraceability} style={{ ...primaryBtn, padding: '12px 24px' }}>
                  <BadgeCheck size={16} /> Tentukan SDG Project di Traceability
                </button>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={resetFlow} style={{ ...secondaryBtn, padding: '12px 24px' }}>
                Assessment Baru / Project Lain
              </button>
              <button onClick={loadAnswers} style={{ ...secondaryBtn, padding: '12px 24px' }}>
                <FileText size={16} /> {showAnswers ? 'Sembunyikan Jawaban' : 'Lihat Jawaban'}
              </button>
            </div>

            {showAnswers && answersDetail && (
              <div className="stat-card" style={{ padding: 24, marginTop: 20 }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#012d1d', margin: '0 0 12px 0' }}>Jawaban Questionnaire</h4>
                {answersDetail.map((a, i) => (
                  <div key={a.question_id} style={{ padding: '10px 0', borderBottom: '1px solid #E9ECEF' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#191c1d' }}>Q{i + 1}. {a.question_text}</div>
                    <div style={{ fontSize: 12, color: '#6C757D', marginTop: 2 }}>
                      Jawaban: {a.answer_text || '—'} • Score: {a.score != null ? `${Math.round(a.score)}%` : '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

const inputStyle = {
  width: '100%', padding: '12px 14px', border: '1px solid #E9ECEF', borderRadius: 8,
  fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  background: '#ffffff', marginBottom: 16, color: '#191c1d'
};
const primaryBtn = {
  padding: '10px 20px', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700,
  letterSpacing: '0.05em', color: '#ffffff', background: '#012d1d', cursor: 'pointer',
  fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap'
};
const secondaryBtn = {
  padding: '10px 20px', borderRadius: 8, fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
  color: '#012d1d', background: '#ffffff', border: '1px solid #012d1d', cursor: 'pointer',
  fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8
};

export default AssessmentFlowPage;
