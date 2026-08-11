import { useEffect, useState } from 'react';
import {
  ChevronRight, Building2, FolderOpen, Play, Scale, Send,
  CircleDollarSign, UtensilsCrossed, Heart, BookOpen, UserCheck,
  Droplets, Briefcase, Recycle, Globe, TreePine, CheckCircle2, XCircle, Loader2
} from 'lucide-react';
import api from '../../shared/api/axios';

const SDG_COLORS = {
  1: '#E5243B', 2: '#DDA63A', 3: '#4C9F38', 4: '#C5192D', 5: '#FF3A21',
  6: '#26BDE2', 8: '#A21942', 10: '#DD1367', 12: '#BF8B2E', 13: '#3F7E44', 15: '#56C02B'
};
const SDG_ICONS = { 1: CircleDollarSign, 2: UtensilsCrossed, 3: Heart, 4: BookOpen, 5: UserCheck, 6: Droplets, 8: Briefcase, 10: Scale, 12: Recycle, 13: Globe, 15: TreePine };
const BASE_COLOR = '#6C757D';

const AssessmentFlowPage = ({ role = 'manager' }) => {
  const [companies, setCompanies] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectInfo, setProjectInfo] = useState(null);

  const [questionnaire, setQuestionnaire] = useState(null);
  const [assessmentId, setAssessmentId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [sdgResults, setSdgResults] = useState([]);
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
        setStep('form');
      } else {
        setFeedback({ type: 'error', text: r.data.message });
      }
    } catch (e) {
      setFeedback({ type: 'error', text: e.response?.data?.message || 'Gagal memulai assessment' });
    } finally { setLoading(false); }
  };

  const handleAnswer = (questionId, type, optionId, optionText, optionScore) => {
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
      return { ...prev, [questionId]: { option_id: optionId, option_text: optionText, option_score: optionScore } };
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
    setFeedback(null);
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
              <strong style={{ fontSize: 13, color: '#414844' }}>SDG Project (hasil assessment):</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {projectInfo.project_sdgs.map(ps => {
                  const Icon = SDG_ICONS[ps.goal_number] || Building2;
                  const color = SDG_COLORS[ps.goal_number] || BASE_COLOR;
                  return (
                    <span key={ps.id} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                      background: `${color}14`, color, borderRadius: 9999, fontSize: 12, fontWeight: 600
                    }}>
                      <Icon size={14} /> GOAL {String(ps.goal_number).padStart(2, '0')} • {ps.name}
                    </span>
                  );
                })}
              </div>
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
              <div>
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
                          {question.sdg_mappings.map(m => (
                            <span key={m.sdg_id} style={{
                              fontSize: 10, padding: '2px 8px', borderRadius: 9999,
                              background:`${SDG_COLORS[m.goal_number] || BASE_COLOR}18`,
                              color: SDG_COLORS[m.goal_number] || BASE_COLOR, fontWeight: 600
                            }}>
                              SDG {String(m.goal_number).padStart(2, '0')} {Math.round(m.weight)}%
                            </span>
                          ))}
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
                              onChange={() => handleAnswer(question.id, question.question_type, opt.id, opt.option_text, opt.score)}
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

      {/* -------- STEP: SDG RESULT -------- */}
      {step === 'result' && (
        <div>
          <div className="stat-card" style={{ padding: 24, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <CheckCircle2 size={20} style={{ color: '#116c4a' }} />
              <h4 style={{ fontSize: 18, fontWeight: 700, color: '#012d1d', margin: 0 }}>Hasil Assessment SDG</h4>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {sdgResults.map(r => {
                const Icon = SDG_ICONS[r.goal_number] || Building2;
                const color = SDG_COLORS[r.goal_number] || BASE_COLOR;
                return (
                  <div key={r.id} style={{
                    border: r.is_met ? '2px solid #116c4a' : '1px solid #E9ECEF',
                    borderRadius: 12, padding: 16, background: r.is_met ? 'rgba(161,244,200,0.15)' : '#ffffff'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{
                        width: 40, height: 40, borderRadius: 8, background: `${color}1A`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Icon size={20} style={{ color }} />
                      </span>
                      {r.is_met
                        ? <CheckCircle2 size={20} style={{ color: '#116c4a' }} />
                        : <XCircle size={20} style={{ color: '#D90429' }} />}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#414844', letterSpacing: '0.03em' }}>
                      GOAL {String(r.goal_number).padStart(2, '0')}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#191c1d', marginBottom: 8 }}>{r.name}</div>
                    <div style={{ height: 8, background: '#E9ECEF', borderRadius: 9999, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 9999,
                        background: r.is_met ? '#116c4a' : '#D90429',
                        width: `${Math.min(r.score, 100)}%`
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: '#6C757D' }}>
                      <span>Score {Math.round(r.score)}%</span>
                      <span>Threshold {Math.round(r.threshold)}%</span>
                    </div>
                    <div style={{
                      marginTop: 10, textAlign: 'center', padding: '6px 0', borderRadius: 6,
                      fontSize: 12, fontWeight: 700,
                      background: r.is_met ? '#116c4a' : '#D90429', color: '#ffffff'
                    }}>
                      {r.is_met ? 'TERPENUHI' : 'BELUM TERPENUHI'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={resetFlow} style={{ ...secondaryBtn, padding: '12px 24px' }}>
            Assessment Baru / Project Lain
          </button>
        </div>
      )}
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