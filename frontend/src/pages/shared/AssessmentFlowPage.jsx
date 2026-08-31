import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, Building2, FolderOpen, Play, Send,
  ChevronDown, Loader2, Info, FileText, CalendarDays, User,
  CheckCircle2, Clock3, TrendingDown, MinusCircle, ListChecks
} from 'lucide-react';
import api from '../../shared/api/axios';
import { getSdgMeta } from '../../shared/constants/sdg';
import { fmtDate } from '../../shared/utils/date';

// Morfologi status (plan revisi #13). Warna yang dijaga netral & profesional,
// mengikuti palet aplikasi (hijau tua sebagian besar), bukan pelangi.
const STATUS_MAP = {
  FULFILLED: { text: 'Terpenuhi', bg: '#116c4a', icon: CheckCircle2 },
  CONTRIBUTING: { text: 'Berkontribusi', bg: '#B45309', icon: Clock3 },
  LOW_CONTRIBUTION: { text: 'Kontribusi Rendah', bg: '#9aa0a6', icon: TrendingDown },
  NOT_ASSESSED: { text: 'Tidak Dinilai', bg: '#6C757D', icon: MinusCircle },
};

const StatusBadge = ({ status }) => {
  const m = STATUS_MAP[status] || STATUS_MAP.NOT_ASSESSED;
  const Icon = m.icon;
  return (
    <span className="status-badge" style={{ background: m.bg, color: '#fff' }}>
      <Icon size={12} /> {m.text}
    </span>
  );
};

const Field = ({ icon, label, value }) => (
  <div>
    <div className="form-label" style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
      {icon} {label}
    </div>
    <div style={{ fontSize: 14, fontWeight: 600, color: '#191c1d' }}>{value}</div>
  </div>
);

const StatCard = ({ label, value, sub }) => (
  <div className="stat-card">
    <div className="form-label" style={{ marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 700, color: '#012d1d', lineHeight: 1.2, marginBottom: 4 }}>{value}</div>
    <div className="text-muted" style={{ fontSize: 12, color: '#6C757D' }}>{sub}</div>
  </div>
);

const statusText = (status) => ({
  completed: 'Selesai',
  in_progress: 'Berlangsung',
  draft: 'Draf',
  cancelled: 'Dibatalkan',
}[status] || status || '-');

// penanda status visual hasil (tanpa warna SDG). uniform green bar + tick threshold.
const ProgressBar = ({ score, threshold, assessed }) => (
  <div>
    <div style={{ position: 'relative', height: 10, background: '#EDF0F2', borderRadius: 9999 }}>
      {assessed && (
        <div style={{
          width: `${Math.min(score, 100)}%`, height: '100%',
          background: 'linear-gradient(90deg, #2D6A4F, #116c4a)', borderRadius: 9999
        }} />
      )}
      {assessed && (
        <div style={{
          position: 'absolute', left: `${threshold}%`, top: -4, bottom: -4, width: 2,
          background: '#414844', borderRadius: 1, transform: 'translateX(-1px)'
        }} title={`Threshold ${Math.round(threshold)}%`} />
      )}
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9aa0a6', marginTop: 4 }}>
      <span>0</span><span>50</span><span>100</span>
    </div>
  </div>
);

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

  const handleAnswer = (questionId, optionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: { option_id: optionId } }));
  };

  const submitAnswers = async (finalize) => {
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        answers: Object.entries(answers).map(([qid, val]) => ({
          question_id: qid,
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
      const status = res ? (res.status || (res.is_met ? 'FULFILLED' : 'CONTRIBUTING')) : 'NOT_ASSESSED';
      return {
        goal_number: s.goal_number,
        name: s.name || meta.name,
        description: s.description || null,
        meta,
        result: res || null,
        status,
        score: res ? res.score : null,
        threshold: res ? res.threshold : (s.threshold != null ? s.threshold : 70),
        applicable_count: res ? res.applicable_question_count : null,
        coverage: res ? res.coverage_percentage : null,
        is_assessed: !!res && (res.applicable_question_count || 0) > 0,
      };
    });
    const assessed = rows.filter(r => r.is_assessed).sort((a, b) => (b.score - a.score) || (a.goal_number - b.goal_number));
    const unassessed = rows.filter(r => !r.is_assessed).sort((a, b) => a.goal_number - b.goal_number);
    return { rows: [...assessed, ...unassessed], assessed, unassessed, assessedCount: assessed.length };
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
        setProjectInfo({ project: { id: d.assessment?.project_id, name: d.assessment?.project_name, company_name: d.assessment?.company_name || null, company_id: d.assessment?.company_id || null } });
        setExpandedGoals([]);
        setAnswersDetail(null);
        setShowAnswers(false);
        setStep('result');
      } else {
        setFeedback({ type: 'error', text: r.data.message });
      }
    } catch (e) {
      setFeedback({ type: 'error', text: e.response?.data?.message || 'Gagal memuat hasil assessment' });
    } finally { setLoading(false); }
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
    <div className="breadcrumb">
      <span>{role === 'admin' ? 'Admin' : 'Dashboard'}</span>
      <ChevronRight size={14} />
      <span>Traceability</span>
      <ChevronRight size={14} />
      <span className="active">SDG Assessment</span>
    </div>
  );

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questionnaire?.sections?.reduce((a, s) => a + s.questions.length, 0) || 0;

  return (
    <div className="assessment-page" style={{ paddingBottom: 100 }}>
      <div className="page-header">
        <div>
          {crumbs}
          <h1 className="page-title" style={{ margin: 0 }}>Assessment Kontribusi SDG</h1>
          <p className="page-description">
            Admin mengisi questionnaire berdasarkan wawancara dengan Manager. Sistem menghitung kontribusi
            setiap SDG melalui scoring & threshold configurable — bukan memilih SDG secara manual.
          </p>
        </div>
      </div>

      {feedback && (
        <div style={{
          padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14, fontWeight: 500
        }} className={feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}>
          {feedback.text}
        </div>
      )}

      {/* ---------- STEP: PILIH PROJECT ---------- */}
      {step === 'project' && (
        <div className="stat-card">
          <div className="card-header" style={{ paddingBottom: 16 }}>
            <FolderOpen size={18} style={{ color: '#012d1d' }} />
            <h3 className="card-title" style={{ margin: 0 }}>Pilih Project</h3>
          </div>

          {role === 'admin' && (
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label"><Building2 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Perusahaan</label>
              <select className="form-input" value={selectedCompanyId} onChange={(e) => loadProjects(e.target.value)}>
                <option value="">Pilih perusahaan...</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 8 }}>
            <label className="form-label">Project (setiap project memiliki satu sistem traceability)</label>
            <select className="form-input" value={selectedProjectId} onChange={(e) => handleSelectProject(e.target.value)}>
              <option value="">{role === 'admin' && !selectedCompanyId ? 'Pilih perusahaan dahulu' : 'Pilih project...'}</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.commodity ? ` (${p.commodity})` : ''}</option>)}
            </select>
          </div>

          {projectInfo && (
            <div className="project-selected">
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#191c1d' }}>{projectInfo.project.name}</div>
                <div style={{ fontSize: 13, color: '#6C757D' }}>
                  {projectInfo.project.company_name} • {projectInfo.project.commodity || '-'} • {projectInfo.project.location || '-'}
                </div>
                <div style={{ fontSize: 12, color: '#2D6A4F', marginTop: 6 }}>
                  SDG project: {projectInfo.project_sdgs.length} • Assessment: {projectInfo.assessments.length}
                </div>
              </div>
              <button className="primary-btn" onClick={startAssessment} disabled={loading}>
                {loading ? <Loader2 size={16} className="spin" /> : <Play size={16} />} Mulai Assessment
              </button>
            </div>
          )}

          {projectInfo?.project_sdgs?.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <strong className="form-label">SDG Project (hasil checklist traceability):</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {projectInfo.project_sdgs.map(ps => (
                  <span key={ps.id} className="sdg-chip">
                    GOAL {String(ps.goal_number).padStart(2, '0')} • {ps.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {projectInfo?.assessments?.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div className="card-header" style={{ paddingBottom: 10 }}>
                <FileText size={18} style={{ color: '#012d1d' }} />
                <strong className="card-title" style={{ fontSize: 14, color: '#012d1d' }}>Riwayat Assessment</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {projectInfo.assessments.map(a => {
                  const isCompleted = a.status === 'completed';
                  return (
                    <div key={a.id} className="history-row">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#191c1d' }}>
                          {a.questionnaire || 'Questionnaire'} {a.questionnaire_version ? `(v${a.questionnaire_version})` : ''}
                        </div>
                        <div style={{ fontSize: 12, color: '#6C757D', marginTop: 2 }}>
                          {statusText(a.status)} • {fmtDate(a.completed_at || a.started_at)}{a.assessor_name ? ` • ${a.assessor_name}` : ''}
                        </div>
                      </div>
                      {isCompleted ? (
                        <button className="secondary-btn" onClick={() => openExistingAssessment(a.id)}>
                          <FileText size={14} /> Lihat Hasil
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: '#9aa0a6', fontWeight: 600 }}>Belum selesai</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-muted" style={{ fontSize: 12, color: '#6C757D', marginTop: 10, marginBottom: 0 }}>
                Klik "Lihat Hasil" untuk membuka kembali informasi SDG dari assessment yang sudah selesai.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---------- STEP: QUESTIONNAIRE FORM ---------- */}
      {step === 'form' && questionnaire && (
        <div className="step-body">
          <div className="stat-card panel-emphasized">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h3 className="card-title" style={{ margin: '0 0 4px 0', fontSize: 20, color: '#012d1d' }}>{questionnaire.name}</h3>
                <div className="text-muted" style={{ fontSize: 13, color: '#6C757D' }}>Versi {questionnaire.version} • {questionnaire.description}</div>
              </div>
              <div style={{ width: 260, maxWidth: '100%' }}>
                <label className="form-label">Assessor (Admin)</label>
                <input className="form-input" value={respondentName} onChange={(e) => setRespondentName(e.target.value)} placeholder="Nama admin" />
              </div>
            </div>
            <div className="progress-hint">
              Satu pertanyaan mewakili satu SDG. Pilih opsi yang paling menggambarkan tingkat implementasi pada project.
            </div>
          </div>

          {questionnaire.sections.map(section => (
            <div key={section.id} className="stat-card">
              <h4 style={{ fontSize: 16, fontWeight: 700, color: '#012d1d', margin: '0 0 4px 0' }}>{section.name}</h4>
              {section.description && <p className="text-muted" style={{ fontSize: 13, color: '#6C757D', margin: '0 0 16px 0' }}>{section.description}</p>}

              {section.questions.map((question, qi) => {
                const current = answers[question.id];
                return (
                  <div key={question.id} className="question-block">
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#191c1d', marginBottom: 12 }}>
                      <span className="q-number">{qi + 1}.</span>
                      {question.question_text}
                      {question.sdg?.goal_number && (
                        <span className="sdg-tag">SDG {String(question.sdg.goal_number).padStart(2, '0')}</span>
                      )}
                    </div>

                    <div className="options-list">
                      {question.options.map(opt => {
                        const isSelected = current?.option_id === opt.id;
                        return (
                          <label key={opt.id} className={`option-item${isSelected ? ' selected' : ''}`}>
                            <input
                              type="radio"
                              name={`q-${question.id}`}
                              checked={isSelected}
                              onChange={() => handleAnswer(question.id, opt.id)}
                            />
                            <span className="option-text">{opt.option_text}</span>
                            <span className="option-score">{Math.round(opt.score)}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          <div className="stat-card bottom-bar">
            <span className="text-muted" style={{ fontSize: 13, color: '#6C757D' }}>
              {answeredCount}/{totalQuestions} pertanyaan terjawab
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="secondary-btn" onClick={() => submitAnswers(false)} disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan Draf'}
              </button>
              <button className="primary-btn" onClick={() => submitAnswers(true)} disabled={saving}>
                {saving ? <Loader2 size={16} className="spin" /> : <Send size={16} />} Submit & Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- STEP: HASIL ASSESSMENT ---------- */}
      {step === 'result' && (() => {
        const { rows, assessed, assessedCount } = buildResultRows();
        const fulfilledCount = assessed.filter(r => r.status === 'FULFILLED').length;
        const notFulfilledCount = assessedCount - fulfilledCount;
        const avgScore = assessedCount ? Math.round(assessed.reduce((a, r) => a + r.score, 0) / assessedCount) : 0;
        const top = assessed.length ? assessed[0] : null;
        const meta = assessmentMeta || {};
        const defaultThreshold = assessed[0]?.threshold ?? 70;
        const fulfilledSdgs = assessed.filter(r => r.status === 'FULFILLED');

        return (
          <div className="step-body">
            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <CheckCircle2 size={20} style={{ color: '#116c4a' }} />
                <h4 style={{ fontSize: 18, fontWeight: 700, color: '#012d1d', margin: 0 }}>Hasil Assessment Kontribusi SDG</h4>
                <span style={{ marginLeft: 'auto', padding: '5px 10px', borderRadius: 9999, background: '#2D6A4F14', color: '#012d1d', fontSize: 11, fontWeight: 700, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                  {statusText(meta.status)}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px 24px' }}>
                <Field icon={<FolderOpen size={14} />} label="Project" value={projectInfo?.project?.name || meta.project_name || '-'} />
                <Field icon={<Building2 size={14} />} label="Perusahaan" value={projectInfo?.project?.company_name || '-'} />
                <Field icon={<FileText size={14} />} label="Questionnaire" value={meta.questionnaire_name ? `${meta.questionnaire_name} (v${meta.questionnaire_version})` : (questionnaire ? `${questionnaire.name} (v${questionnaire.version})` : '-')} />
                <Field icon={<CalendarDays size={14} />} label="Tanggal Selesai" value={fmtDate(meta.completed_at)} />
                <Field icon={<User size={14} />} label="Assessor" value={meta.assessor_name || respondentName || '-'} />
              </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: 20 }}>
              <StatCard label="Terpenuhi" value={`${fulfilledCount}/${assessedCount}`} sub="goal dinilai memenuhi threshold" />
              <StatCard label="Belum / Rendah" value={`${notFulfilledCount}`} sub="kontribusi di bawah threshold" />
              <StatCard label="Rata-rata Skor" value={`${avgScore}%`} sub="dari goal yang dinilai" />
              <StatCard label="Skor Tertinggi" value={top ? `${Math.round(top.score)}%` : '-'} sub={top ? `GOAL ${String(top.goal_number).padStart(2, '0')} ${top.name}` : '-'} />
            </div>

            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h4 style={{ fontSize: 18, fontWeight: 700, color: '#012d1d', margin: '0 0 4px 0' }}>Skor Kontribusi per SDG</h4>
                  <p className="text-muted" style={{ fontSize: 13, color: '#6C757D', margin: 0 }}>
                    Diurutkan dari skor tertinggi. Garis pada bar menunjukkan threshold ({Math.round(defaultThreshold)}%).
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(['FULFILLED', 'CONTRIBUTING', 'LOW_CONTRIBUTION', 'NOT_ASSESSED']).map(s => (
                    <StatusBadge key={s} status={s} />
                  ))}
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>SDG</th>
                      <th style={{ width: 300 }}>Kontribusi</th>
                      <th style={{ width: 90 }}>Skor</th>
                      <th style={{ width: 150 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={r.goal_number}>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: 12, color: '#414844', letterSpacing: '0.03em' }}>GOAL {String(r.goal_number).padStart(2, '0')}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#191c1d' }}>{r.name}</div>
                        </td>
                        <td>
                          <ProgressBar score={r.score || 0} threshold={r.threshold || 0} assessed={r.is_assessed} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: r.is_assessed ? '#191c1d' : '#9aa0a6' }}>
                            {r.is_assessed ? `${Math.round(r.score)}%` : '—'}
                          </div>
                          <div style={{ fontSize: 11, color: '#6C757D' }}>
                            {r.is_assessed ? `Thr ${Math.round(r.threshold)}%` : 'belum dinilai'}
                          </div>
                        </td>
                        <td><StatusBadge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Info size={20} style={{ color: '#012d1d' }} />
                <h4 style={{ fontSize: 18, fontWeight: 700, color: '#012d1d', margin: 0 }}>Detail Hasil SDG</h4>
              </div>
              <p className="text-muted" style={{ fontSize: 13, color: '#6C757D', margin: '0 0 16px 0' }}>
                Klik baris untuk melihat faktor/pertanyaan yang memengaruhi score serta cakupan penilaian.
              </p>

              {rows.map(r => {
                const expanded = expandedGoals.includes(r.goal_number);
                return (
                  <div key={r.goal_number} className="detail-card">
                    <div className="detail-header" onClick={() => toggleExpand(r.goal_number)}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: r.is_assessed ? '#116c4a' : '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FolderOpen size={18} style={{ color: r.is_assessed ? '#fff' : '#6C757D' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#191c1d' }}>
                          GOAL {String(r.goal_number).padStart(2, '0')} — {r.name}
                        </div>
                        <div style={{ fontSize: 12, color: '#6C757D' }}>
                          {r.is_assessed
                            ? `Skor ${Math.round(r.score)}% • Threshold ${Math.round(r.threshold)}% • Cakupan ${Math.round(r.coverage || 0)}% • ${r.applicable_count} pertanyaan menilai`
                            : 'Tidak ada pertanyaan yang berlaku untuk SDG ini pada questionnaire.'}
                        </div>
                      </div>
                      <StatusBadge status={r.status} />
                      <ChevronDown size={18} style={{ color: '#6C757D', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease', flexShrink: 0 }} />
                    </div>

                    {expanded && (
                      <div className="detail-body">
                        {r.description && <p style={{ fontSize: 13, color: '#414844', margin: '0 0 14px 0', lineHeight: 1.5 }}>{r.description}</p>}

                        {r.is_assessed && (
                          <div style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <span className="form-label">Skor vs Threshold</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#191c1d' }}>{Math.round(r.score)}% / {Math.round(r.threshold)}%</span>
                            </div>
                            <ProgressBar score={r.score} threshold={r.threshold} assessed={r.is_assessed} />
                          </div>
                        )}

                        {r.is_assessed && r.result?.criteria && (
                          <div style={{ marginBottom: 14 }}>
                            <div className="form-label" style={{ marginBottom: 8 }}>Kriteria status Terpenuhi:</div>
                            {['min_score', 'min_questions', 'min_coverage'].map(key => {
                              const c = r.result.criteria[key];
                              if (!c) return null;
                              return (
                                <div key={key} style={{
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  fontSize: 13, color: c.met ? '#116c4a' : '#B45309',
                                  padding: '4px 0'
                                }}>
                                  {c.met ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}
                                  <span style={{ color: '#191c1d' }}>{c.label}</span>
                                  {!c.met && <span style={{ color: '#B45309', fontWeight: 600 }}>(belum terpenuhi)</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {r.is_assessed && (
                          <div>
                            <div className="form-label" style={{ marginBottom: 8 }}>Faktor yang memengaruhi skor ({r.applicable_count} pertanyaan):</div>
                            {r.result?.contributions?.length ? (
                              r.result.contributions.map((c, i) => (
                                <div key={c.question_id} className="contribution-row">
                                  <span className="q-badge">Q{i + 1}</span>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, color: '#191c1d', lineHeight: 1.4 }}>{c.question_text}</div>
                                    <div style={{ fontSize: 11, color: '#6C757D', marginTop: 2 }}>
                                      Skor jawaban {Math.round(c.score)}% • Bobot {Math.round(c.weight_pct)}%
                                    </div>
                                  </div>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: '#116c4a', flexShrink: 0 }}>+{Math.round(c.contribution)} poin</span>
                                </div>
                              ))
                            ) : (
                              <div className="text-muted" style={{ fontSize: 12, color: '#9aa0a6' }}>Tidak ada kontribusi tercatat.</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="stat-card panel-emphasized">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <CheckCircle2 size={20} style={{ color: '#116c4a' }} />
                <h4 style={{ fontSize: 18, fontWeight: 700, color: '#012d1d', margin: 0 }}>Langkah Berikutnya: Tentukan SDG Project</h4>
              </div>
              <p className="text-muted" style={{ fontSize: 13, color: '#6C757D', margin: '0 0 12px 0' }}>
                Halaman ini menampilkan hasil kontribusi (skor & status). SDG yang menjadi <b>SDG Project</b> ditentukan
                oleh Admin melalui checklist di menu Traceability berdasarkan hasil di atas.
              </p>
              <div style={{ marginBottom: 16 }}>
                <div className="form-label" style={{ marginBottom: 8 }}>Rekomendasi SDG (status Terpenuhi):</div>
                {fulfilledSdgs.length ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {fulfilledSdgs.map(r => (
                      <span key={r.goal_number} className="sdg-chip">
                        GOAL {String(r.goal_number).padStart(2, '0')} • {r.name} <span style={{ color: '#6C757D', fontWeight: 600 }}>({Math.round(r.score)}%)</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted" style={{ fontSize: 13, color: '#9aa0a6' }}>Tidak ada SDG yang mencapai threshold pada assessment ini.</div>
                )}
              </div>
              {role === 'admin' && (
                <button className="primary-btn" style={{ padding: '12px 24px' }} onClick={navigateToTraceability}>
                  <ListChecks size={16} /> Tentukan SDG Project di Traceability
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="secondary-btn" style={{ padding: '12px 24px' }} onClick={resetFlow}>
                Assessment Baru / Project Lain
              </button>
              <button className="secondary-btn" style={{ padding: '12px 24px' }} onClick={loadAnswers}>
                <FileText size={16} /> {showAnswers ? 'Sembunyikan Jawaban' : 'Lihat Jawaban'}
              </button>
            </div>

            {showAnswers && answersDetail && (
              <div className="stat-card" style={{ marginTop: 20 }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#012d1d', margin: '0 0 12px 0' }}>Jawaban Questionnaire</h4>
                {answersDetail.map((a, i) => (
                  <div key={a.question_id} style={{ padding: '10px 0', borderBottom: '1px solid #E9ECEF' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#191c1d' }}>Q{i + 1}. {a.question_text}</div>
                    <div style={{ fontSize: 12, color: '#6C757D', marginTop: 2 }}>
                      Jawaban: {a.answer_text || '—'} • Skor: {a.score != null ? `${Math.round(a.score)}%` : '—'}
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

export default AssessmentFlowPage;