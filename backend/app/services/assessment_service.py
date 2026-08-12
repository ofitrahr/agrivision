"""
Traceability Assessment Service (Arsitektur Baru)

Flow (plan.md #9, #26):
Admin interview Manager -> Questionnaire -> Answers -> Answer Score
    -> Question-SDG Weight -> SDG Score -> Threshold -> Assessment SDG Result
    -> Project SDG (is_met) -> Company SDG Summary (agregasi).

Menjaga paralel dengan arsitektur lama; tidak menghapus tabel lain.
"""
from datetime import datetime
from decimal import Decimal

from app.db.database import db
from app.db.models import (
    Project,
    ProjectTraceabilityProfile,
    SdgMaster,
    Questionnaire,
    QuestionSection,
    Question,
    QuestionOption,
    QuestionSdg,
    TraceAssessment,
    AssessmentAnswer,
    AssessmentAnswerOption,
    AssessmentSdgResult,
    ProjectSdg,
    ProjectSdgVerification,
)
from app.services.upload_service import save_file_locally


# ---------------------------------------------------------------
# SDG MASTER
# ---------------------------------------------------------------
# Katalog lengkap 17 SDG (goal_number, name, description) sebagai satu sumber.
SDG_CATALOG = [
    (1, "No Poverty", "Mengakhiri kemiskinan dalam segala bentuknya di mana pun. Project mendukung peningkatan pendapatan dan kesejahteraan petani."),
    (2, "Zero Hunger", "Mengakhiri kelaparan, mencapai ketahanan pangan dan gizi yang lebih baik, serta mendukung pertanian berkelanjutan."),
    (3, "Good Health and Well-being", "Memastikan kehidupan yang sehat dan mendukung kesejahteraan bagi semua orang di segala usia."),
    (4, "Quality Education", "Memastikan pendidikan yang inklusif dan bermutu serta mendukung kesempatan belajar sepanjang hayat."),
    (5, "Gender Equality", "Mencapai kesetaraan gender dan memberdayakan semua perempuan dan anak perempuan."),
    (6, "Clean Water and Sanitation", "Memastikan ketersediaan dan pengelolaan air bersih serta sanitasi yang berkelanjutan."),
    (7, "Affordable and Clean Energy", "Memastikan akses terhadap energi yang terjangkau, andal, berkelanjutan, dan modern."),
    (8, "Decent Work and Economic Growth", "Mendukung pertumbuhan ekonomi yang inklusif dan berkelanjutan serta pekerjaan layak bagi semua."),
    (9, "Industry, Innovation and Infrastructure", "Membangun infrastruktur yang tangguh, mendukung industrialisasi inklusif, dan mendorong inovasi."),
    (10, "Reduced Inequalities", "Mengurangi ketimpangan di dalam dan antar negara."),
    (11, "Sustainable Cities and Communities", "Membangun kota dan pemukiman yang inklusif, aman, tangguh, dan berkelanjutan."),
    (12, "Responsible Consumption and Production", "Mendukung pola konsumsi dan produksi yang bertanggung jawab."),
    (13, "Climate Action", "Mengambil tindakan segera untuk memerangi perubahan iklim dan dampaknya."),
    (14, "Life Below Water", "Melestarikan dan memanfaatkan samudera, laut, dan sumber daya kelautan secara berkelanjutan."),
    (15, "Life on Land", "Melindungi, memulihkan, dan mendukung pemanfaatan ekosistem daratan secara berkelanjutan."),
    (16, "Peace, Justice and Strong Institutions", "Mendukung masyarakat yang damai dan inklusif serta institusi yang kuat."),
    (17, "Partnerships for the Goals", "Memperkuat sarana pelaksanaan dan menghidupkan kembali kemitraan global untuk pembangunan berkelanjutan."),
]


def seed_sdg_masters(threshold=70.00):
    """Pastikan SDG Master (goal_number 1..17) tersedia & lengkap. (plan.md #34)

    Idempoten: goal yang belum ada dibuat, goal yang sudah ada dilengkapi
    description-nya tanpa mengubah threshold/data lain.
    """
    created = 0
    updated = 0
    for num, name, description in SDG_CATALOG:
        sdg = SdgMaster.query.filter_by(goal_number=num).first()
        if not sdg:
            db.session.add(SdgMaster(
                goal_number=num, name=name, description=description, threshold=threshold
            ))
            created += 1
        else:
            if not sdg.description and description:
                sdg.description = description
                updated += 1
    db.session.commit()
    return created


def list_sdg_masters(active_only=True):
    q = SdgMaster.query
    if active_only:
        q = q.filter_by(is_active=True)
    return [
        {
            "id": str(s.id),
            "goal_number": s.goal_number,
            "name": s.name,
            "description": s.description,
            "threshold": float(s.threshold),
            "is_active": s.is_active,
        }
        for s in q.order_by(SdgMaster.goal_number).all()
    ]


# ---------------------------------------------------------------
# PROJECT TRACEABILITY PROFILE
# ---------------------------------------------------------------
def get_or_create_profile(project_id):
    profile = ProjectTraceabilityProfile.query.filter_by(project_id=project_id).first()
    if not profile:
        profile = ProjectTraceabilityProfile(project_id=project_id)
        db.session.add(profile)
        db.session.commit()
    return profile


def get_project_traceability_data(project_id):
    project = Project.query.get(project_id)
    if not project:
        return {"success": False, "message": "Project tidak ditemukan"}, 404
    profile = ProjectTraceabilityProfile.query.filter_by(project_id=project_id).first()

    # Project SDG hasil assessment terakhir yang completed
    project_sdgs = []
    if profile:
        rows = ProjectSdg.query.filter_by(project_traceability_id=profile.id).all()
        for row in rows:
            sdg = row.sdg_master
            project_sdgs.append({
                "id": str(row.id),
                "sdg_id": str(sdg.id),
                "goal_number": sdg.goal_number,
                "name": sdg.name,
                "threshold": float(sdg.threshold),
            })

    assessments = []
    if profile:
        for a in profile.assessments:
            assessments.append({
                "id": str(a.id),
                "questionnaire": a.questionnaire.name if a.questionnaire else None,
                "questionnaire_version": a.questionnaire.version if a.questionnaire else None,
                "status": a.status,
                "assessor_name": a.assessor_name,
                "started_at": a.started_at.isoformat() if a.started_at else None,
                "completed_at": a.completed_at.isoformat() if a.completed_at else None,
            })

    return {
        "success": True,
        "data": {
            "project": {
                "id": str(project.id),
                "name": project.name,
                "commodity": project.commodity,
                "location": project.location,
                "company_id": str(project.company_id),
                "company_name": project.company.name if project.company else None,
            },
            "profile": {
                "id": str(profile.id) if profile else None,
                "title": profile.title if profile else None,
                "tagline": profile.tagline if profile else None,
                "origin_story": profile.origin_story if profile else None,
                "description": profile.description if profile else None,
                "status": profile.status if profile else 'draft',
            },
            "project_sdgs": project_sdgs,
            "assessments": assessments,
        }
    }, 200


def save_project_traceability_profile(project_id, data):
    project = Project.query.get(project_id)
    if not project:
        return {"success": False, "message": "Project tidak ditemukan"}, 404
    profile = get_or_create_profile(project_id)

    profile.title = data.get('title', profile.title)
    profile.tagline = data.get('tagline', profile.tagline)
    profile.origin_story = data.get('origin_story', profile.origin_story)
    profile.description = data.get('description', profile.description)
    if 'status' in data and data['status'] in ['draft', 'published']:
        profile.status = data['status']
    db.session.commit()

    return {"success": True, "message": "Traceability project berhasil disimpan", "data": {"id": str(profile.id), "status": profile.status}}, 200


# ---------------------------------------------------------------
# QUESTIONNAIRE
# ---------------------------------------------------------------
def get_active_questionnaire():
    q = Questionnaire.query.filter_by(is_active=True).order_by(Questionnaire.created_at.desc()).first()
    return q


def list_questionnaires():
    return [
        {
            "id": str(q.id),
            "name": q.name,
            "description": q.description,
            "version": q.version,
            "is_active": q.is_active,
            "question_count": len(q.questions),
            "section_count": len(q.sections),
        }
        for q in Questionnaire.query.order_by(Questionnaire.created_at.desc()).all()
    ]


def serialize_questionnaire(questionnaire_id):
    q = Questionnaire.query.get(questionnaire_id)
    if not q:
        return None

    sections = []
    for sec in sorted(q.sections, key=lambda s: s.section_order or 0):
        questions = []
        for question in sorted(sec.questions, key=lambda x: x.question_order or 0):
            if not question.is_active:
                continue
            options = [
                {
                    "id": str(o.id),
                    "option_text": o.option_text,
                    "score": float(o.score),
                    "option_order": o.option_order,
                    "is_exclusive": o.is_exclusive,
                }
                for o in sorted(question.options, key=lambda x: x.option_order or 0)
            ]
            sdg_mappings = [
                {
                    "sdg_id": str(m.sdg_id),
                    "goal_number": m.sdg_master.goal_number,
                    "name": m.sdg_master.name,
                    "weight": float(m.weight),
                }
                for m in question.sdg_mappings
                if m.sdg_master
            ]
            questions.append({
                "id": str(question.id),
                "question_text": question.question_text,
                "question_type": question.question_type,
                "question_order": question.question_order,
                "is_required": question.is_required,
                "options": options,
                "sdg_mappings": sdg_mappings,
            })
        sections.append({
            "id": str(sec.id),
            "name": sec.name,
            "description": sec.description,
            "section_order": sec.section_order,
            "questions": questions,
        })

    return {
        "id": str(q.id),
        "name": q.name,
        "description": q.description,
        "version": q.version,
        "is_active": q.is_active,
        "sections": sections,
    }


# ---------------------------------------------------------------
# ASSESSMENT
# ---------------------------------------------------------------
ALLOWED_STATUS = ['draft', 'in_progress', 'completed', 'cancelled']


def serialize_assessment(assessment):
    q = assessment.questionnaire
    return {
        "id": str(assessment.id),
        "project_traceability_id": str(assessment.project_traceability_id),
        "project_id": str(assessment.project_traceability.project_id),
        "project_name": assessment.project_traceability.project.name,
        "questionnaire_id": str(q.id) if q else None,
        "questionnaire_name": q.name if q else None,
        "questionnaire_version": q.version if q else None,
        "status": assessment.status,
        "assessor_id": str(assessment.assessor_id) if assessment.assessor_id else None,
        "assessor_name": assessment.assessor_name,
        "respondent_id": str(assessment.respondent_id) if assessment.respondent_id else None,
        "notes": assessment.notes,
        "evidence_url": assessment.evidence_url,
        "started_at": assessment.started_at.isoformat() if assessment.started_at else None,
        "completed_at": assessment.completed_at.isoformat() if assessment.completed_at else None,
        "assessed_at": assessment.assessed_at.isoformat() if assessment.assessed_at else None,
        "created_at": assessment.created_at.isoformat() if assessment.created_at else None,
    }


def serialize_sdg_results(assessment_id):
    """SDG result + breakdown kontribusi per pertanyaan.

    Setiap hasil menyertakan `contributions`: daftar pertanyaan yang memetakan
    ke SDG tersebut beserta score jawaban, weight, dan kontribusinya terhadap
    skor SDG (0-100). Digunakan UI utk menampilkan faktor yang memengaruhi score.
    """
    assessment = TraceAssessment.query.get(assessment_id)
    rows = AssessmentSdgResult.query.filter_by(assessment_id=assessment_id).all()
    results = []
    for r in rows:
        contributions = []
        if assessment and assessment.questionnaire_id:
            mappings = QuestionSdg.query.join(Question).filter(
                QuestionSdg.sdg_id == r.sdg_id,
                Question.questionnaire_id == assessment.questionnaire_id,
                Question.is_active.is_(True),
            ).all()
            total_weight = sum(float(m.weight) for m in mappings) or 1.0
            answers = {a.question_id: a for a in assessment.answers}
            for m in mappings:
                q = m.question
                ans = answers.get(m.question_id)
                score = float(ans.score) if ans else 0.0
                weight = float(m.weight)
                contributions.append({
                    "question_id": str(m.question_id),
                    "question_text": q.question_text if q else None,
                    "question_type": q.question_type if q else None,
                    "score": score,
                    "weight": weight,
                    "weight_pct": round(weight / total_weight * 100, 2),
                    "contribution": round(score * weight / total_weight, 2),
                })
        results.append({
            "id": str(r.id),
            "sdg_id": str(r.sdg_id),
            "goal_number": r.sdg_master.goal_number if r.sdg_master else None,
            "name": r.sdg_master.name if r.sdg_master else None,
            "description": r.sdg_master.description if r.sdg_master else None,
            "score": float(r.score),
            "threshold": float(r.threshold),
            "is_met": r.is_met,
            "calculated_at": r.calculated_at.isoformat() if r.calculated_at else None,
            "contributions": contributions,
        })
    return results


def serialize_answers(assessment_id, questionnaire_id):
    answers = AssessmentAnswer.query.filter_by(assessment_id=assessment_id).all()
    q = Questionnaire.query.get(questionnaire_id)
    if not q:
        return []

    out = []
    for question in q.questions:
        if not question.is_active:
            continue
        ans = next((a for a in answers if a.question_id == question.id), None)
        selected_ids = []
        if ans:
            selected_ids = [str(so.option_id) for so in ans.selected_options]
        out.append({
            "question_id": str(question.id),
            "question_text": question.question_text,
            "question_type": question.question_type,
            "answer_text": ans.answer_text if ans else None,
            "score": float(ans.score) if ans else None,
            "selected_option_ids": selected_ids,
        })
    return out


def start_assessment(project_id, questionnaire_id, current_user, data=None):
    """Mulai assessment baru (status draft -> in_progress). (plan.md #23)"""
    project = Project.query.get(project_id)
    if not project:
        return {"success": False, "message": "Project tidak ditemukan"}, 404

    if not questionnaire_id:
        q = get_active_questionnaire()
        if not q:
            return {"success": False, "message": "Belum ada questionnaire aktif. Seed questionnaire terlebih dahulu."}, 400
        questionnaire_id = q.id
    else:
        q = Questionnaire.query.get(questionnaire_id)
        if not q:
            return {"success": False, "message": "Questionnaire tidak ditemukan"}, 404

    profile = get_or_create_profile(project_id)

    data = data or {}
    assessment = TraceAssessment(
        project_traceability_id=profile.id,
        questionnaire_id=questionnaire_id,
        assessor_id=current_user.id if current_user else None,
        respondent_id=data.get('respondent_id'),
        assessor_name=data.get('assessor_name') or (current_user.full_name if current_user else None),
        status='in_progress',
        started_at=datetime.utcnow(),
        notes=data.get('notes'),
    )
    db.session.add(assessment)
    db.session.commit()

    return {
        "success": True,
        "message": "Assessment dimulai",
        "data": serialize_assessment(assessment),
    }, 201


def get_assessment_detail(assessment_id):
    assessment = TraceAssessment.query.get(assessment_id)
    if not assessment:
        return {"success": False, "message": "Assessment tidak ditemukan"}, 404

    questionnaire = serialize_questionnaire(assessment.questionnaire_id)
    answers = serialize_answers(assessment_id, assessment.questionnaire_id)
    results = serialize_sdg_results(assessment_id)
    project_sdg_ids = [
        str(ps.sdg_id)
        for ps in ProjectSdg.query.filter_by(project_traceability_id=assessment.project_traceability_id).all()
    ]

    return {
        "success": True,
        "data": {
            "assessment": serialize_assessment(assessment),
            "questionnaire": questionnaire,
            "answers": answers,
            "sdg_results": results,
            "all_sdgs": list_sdg_masters(active_only=False),
            "project_sdg_ids": project_sdg_ids,
        }
    }, 200


def submit_answers(assessment_id, current_user, data):
    """Simpan jawaban & kalkulasi SDG. (plan.md #15, #16, #26, #27)"""
    assessment = TraceAssessment.query.get(assessment_id)
    if not assessment:
        return {"success": False, "message": "Assessment tidak ditemukan"}, 404
    if assessment.status == 'completed':
        return {"success": False, "message": "Assessment sudah completed, tidak dapat diubah"}, 400

    answers = data.get('answers', [])
    questionnaire = Questionnaire.query.get(assessment.questionnaire_id)
    if not questionnaire:
        return {"success": False, "message": "Questionnaire tidak ditemukan"}, 400

    question_map = {str(q.id): q for q in questionnaire.questions if q.is_active}

    # Hapus jawaban lama (re-submit)
    AssessmentAnswer.query.filter_by(assessment_id=assessment_id).delete()

    for item in answers:
        question_id = item.get('question_id')
        question = question_map.get(question_id)
        if not question:
            continue

        answer_text = None
        score = 0
        selected_ids = item.get('option_ids', []) or item.get('selected_option_ids', [])
        option_id_single = item.get('option_id')

        if option_id_single:
            selected_ids = [option_id_single]

        if not selected_ids and not item.get('answer_text'):
            # skip jawaban kosong utk soal wajib
            if question.is_required:
                continue
            answer_text = item.get('answer_text')
        else:
            opts = QuestionOption.query.filter(QuestionOption.id.in_(selected_ids)).all()
            if question.question_type == 'multiple_choice':
                # plan.md #16: jumlah score option yang dipilih, klamp 0-100
                score = sum(float(o.score) for o in opts)
                score = min(max(score, 0), 100)
                answer_text = ", ".join(str(o.option_text) for o in opts)
            else:
                # single choice: pakai score option terpilih
                if opts:
                    score = float(opts[0].score)
                    answer_text = str(opts[0].option_text)
                elif item.get('answer_text'):
                    answer_text = item['answer_text']

        answer = AssessmentAnswer(
            assessment_id=assessment_id,
            question_id=question_id,
            answer_text=answer_text,
            score=score,
            answered_at=datetime.utcnow(),
        )
        db.session.add(answer)
        db.session.flush()

        # simpan multiple-choice selected options
        if question.question_type == 'multiple_choice' and selected_ids:
            for oid in selected_ids:
                db.session.add(AssessmentAnswerOption(answer_id=answer.id, option_id=oid))

    # update status
    assessment.status = data.get('status', 'in_progress')
    if assessment.status == 'completed':
        assessment.completed_at = datetime.utcnow()
        assessment.assessed_at = datetime.utcnow()
        _calculate_sdg(assessment)
    elif assessment.status == 'draft':
        assessment.status = 'in_progress'

    db.session.commit()

    return {
        "success": True,
        "message": "Jawaban berhasil disimpan",
        "data": {
            "status": assessment.status,
            "assessment": serialize_assessment(assessment),
            "sdg_results": serialize_sdg_results(assessment_id),
            "all_sdgs": list_sdg_masters(active_only=False),
        }
    }, 200


def _calculate_sdg(assessment):
    """Kalkulasi SDG score = sum(question_score * weight). (plan.md #26, #27, #29)

    Catatan: fungsi ini HANYA menulis AssessmentSdgResult (hasil penilaian).
    Penentuan Project SDG tidak dilakukan di sini — dilakukan secara manual oleh
    Admin melalui halaman Traceability (save_project_sdg_selection).
    """
    # delete hasil lama
    AssessmentSdgResult.query.filter_by(assessment_id=assessment.id).delete()

    answers = {a.question_id: a for a in assessment.answers}
    # kumpulkan sdg ikut serta
    mappings = QuestionSdg.query.join(Question).filter(
        Question.questionnaire_id == assessment.questionnaire_id,
        Question.is_active.is_(True),
    ).all()

    sdg_agg = {}
    for m in mappings:
        if m.sdg_id not in sdg_agg:
            sdg_agg[m.sdg_id] = []
        sdg_agg[m.sdg_id].append(m)

    results = []
    for sdg_id, mapping_list in sdg_agg.items():
        total_weight = sum(float(m.weight) for m in mapping_list)
        if total_weight <= 0:
            continue

        weighted_sum = Decimal(0)
        for m in mapping_list:
            ans = answers.get(m.question_id)
            if ans:
                weighted_sum += Decimal(ans.score) * Decimal(m.weight)

        raw_score = (weighted_sum / Decimal(total_weight)) * Decimal(100)

        sdg_master = SdgMaster.query.get(sdg_id)
        threshold = sdg_master.threshold if sdg_master else Decimal(70)
        score = min(max(raw_score, 0), 100)
        is_met = score >= threshold

        result = AssessmentSdgResult(
            assessment_id=assessment.id,
            sdg_id=sdg_id,
            score=score,
            threshold=threshold,
            is_met=is_met,
            calculated_at=datetime.utcnow(),
        )
        db.session.add(result)
        results.append(result)

    return results


def change_assessment_status(assessment_id, status):
    if status not in ALLOWED_STATUS:
        return {"success": False, "message": f"Status harus salah satu dari {ALLOWED_STATUS}"}, 400
    assessment = TraceAssessment.query.get(assessment_id)
    if not assessment:
        return {"success": False, "message": "Assessment tidak ditemukan"}, 404

    assessment.status = status
    if status == 'completed':
        assessment.completed_at = datetime.utcnow()
        assessment.assessed_at = datetime.utcnow()
        _calculate_sdg(assessment)
    elif status == 'cancelled':
        assessment.assessed_at = None
    db.session.commit()
    return {"success": True, "message": f"Status menjadi {status}", "data": serialize_assessment(assessment)}, 200


def delete_assessment(assessment_id):
    assessment = TraceAssessment.query.get(assessment_id)
    if not assessment:
        return {"success": False, "message": "Assessment tidak ditemukan"}, 404
    profile_id = assessment.project_traceability_id
    ProjectSdg.query.filter_by(project_traceability_id=profile_id).delete()
    db.session.delete(assessment)
    db.session.commit()
    return {"success": True, "message": "Assessment dihapus"}, 200


# ---------------------------------------------------------------
# COMPANY SDG SUMMARY (plan.md #8, #36)
# ---------------------------------------------------------------
def get_company_sdg_summary(company_id):
    projects = Project.query.filter_by(company_id=company_id).all()
    sdg_map = {}
    for project in projects:
        profile = ProjectTraceabilityProfile.query.filter_by(project_id=project.id).first()
        if not profile:
            continue
        for ps in ProjectSdg.query.filter_by(project_traceability_id=profile.id).all():
            sdg = ps.sdg_master
            sdg_map[sdg.goal_number] = {
                "sdg_id": str(sdg.id),
                "goal_number": sdg.goal_number,
                "name": sdg.name,
                "projects": sdg_map.get(sdg.goal_number, {}).get("projects", []) + [project.name],
            }

    company_sdgs = [v for _, v in sorted(sdg_map.items())]
    return {
        "success": True,
        "data": {
            "company_id": company_id,
            "total_sdgs_fulfilled": len(company_sdgs),
            "sdgs": company_sdgs,
        }
    }, 200


# ---------------------------------------------------------------
# PROJECT SDG SELECTION (admin/traceability, per project)
# ---------------------------------------------------------------
def _serialize_project_verification(verification):
    return {
        "assessed_by": verification.assessed_by if verification else None,
        "evidence_file_url": verification.evidence_file_url if verification else None,
        "evidence_file_type": verification.evidence_file_type if verification else None,
        "assessment_date": verification.assessment_date.isoformat() if verification and verification.assessment_date else None,
    }


def _get_or_create_project_verification(profile):
    verification = ProjectSdgVerification.query.filter_by(project_traceability_id=profile.id).first()
    if not verification:
        verification = ProjectSdgVerification(project_traceability_id=profile.id)
        db.session.add(verification)
    return verification


def _get_latest_completed_assessment(profile):
    return TraceAssessment.query.filter_by(
        project_traceability_id=profile.id,
        status='completed',
    ).order_by(TraceAssessment.completed_at.desc()).first()


def get_project_sdg_selection(project_id):
    """Data halaman admin/traceability (project-level):
    katalog SDG + status terpilih + verifikasi + ringkasan assessment terakhir."""
    project = Project.query.get(project_id)
    if not project:
        return {"success": False, "message": "Project tidak ditemukan"}, 404

    profile = ProjectTraceabilityProfile.query.filter_by(project_id=project.id).first()
    selected_rows = []
    if profile:
        selected_rows = ProjectSdg.query.filter_by(project_traceability_id=profile.id).all()
    selected_map = {ps.sdg_id: ps for ps in selected_rows}
    verification = ProjectSdgVerification.query.filter_by(project_traceability_id=profile.id).first() if profile else None

    sdgs = []
    for sdg in SdgMaster.query.order_by(SdgMaster.goal_number).all():
        ps = selected_map.get(sdg.id)
        sdgs.append({
            "id": str(sdg.id),
            "goal_number": sdg.goal_number,
            "name": sdg.name,
            "description": sdg.description,
            "threshold": float(sdg.threshold),
            "selected": ps is not None,
            "display_order": ps.display_order if hasattr(ps, 'display_order') else 0,
        })

    latest = _get_latest_completed_assessment(profile) if profile else None
    latest_assessment = None
    if latest:
        results = [
            {
                "goal_number": r.sdg_master.goal_number if r.sdg_master else None,
                "name": r.sdg_master.name if r.sdg_master else None,
                "score": float(r.score),
                "threshold": float(r.threshold),
                "is_met": r.is_met,
            }
            for r in AssessmentSdgResult.query.filter_by(assessment_id=latest.id).all()
        ]
        latest_assessment = {
            "id": str(latest.id),
            "questionnaire_name": latest.questionnaire.name if latest.questionnaire else None,
            "completed_at": latest.completed_at.isoformat() if latest.completed_at else None,
            "assessor_name": latest.assessor_name,
            "results": results,
            "assessed_count": len(results),
            "met_count": sum(1 for r in results if r["is_met"]),
        }

    return {
        "success": True,
        "data": {
            "project": {
                "id": str(project.id),
                "name": project.name,
                "commodity": project.commodity,
                "location": project.location,
                "company_id": str(project.company_id),
                "company_name": project.company.name if project.company else None,
            },
            "sdgs": sdgs,
            "verification": _serialize_project_verification(verification),
            "latest_assessment": latest_assessment,
            "project_sdg_ids": [str(ps.sdg_id) for ps in selected_rows],
        }
    }, 200


def save_project_sdg_selection(project_id, data):
    """Simpan checklist SDG project + nama assessor. Menulis ProjectSdg."""
    project = Project.query.get(project_id)
    if not project:
        return {"success": False, "message": "Project tidak ditemukan"}, 404

    profile = ProjectTraceabilityProfile.query.filter_by(project_id=project.id).first()
    if not profile:
        profile = ProjectTraceabilityProfile(project_id=project.id)
        db.session.add(profile)
        db.session.flush()

    submitted = data.get('sdgs', [])
    submitted_ids = set()
    latest = _get_latest_completed_assessment(profile)
    latest_result_map = {}
    if latest:
        for r in AssessmentSdgResult.query.filter_by(assessment_id=latest.id).all():
            latest_result_map[r.sdg_id] = r.id

    for item in submitted:
        sdg_id = item.get('sdg_id')
        sdg = SdgMaster.query.get(sdg_id)
        if not sdg:
            return {"success": False, "message": "SDG tidak valid"}, 400
        submitted_ids.add(sdg_id)

        ps = ProjectSdg.query.filter_by(project_traceability_id=profile.id, sdg_id=sdg_id).first()
        if not ps:
            ps = ProjectSdg(
                project_traceability_id=profile.id,
                sdg_id=sdg_id,
                assessment_sdg_result_id=latest_result_map.get(sdg_id),
            )
            db.session.add(ps)

    removed_query = ProjectSdg.query.filter(ProjectSdg.project_traceability_id == profile.id)
    if submitted_ids:
        removed_query = removed_query.filter(~ProjectSdg.sdg_id.in_(submitted_ids))
    for r in removed_query.all():
        db.session.delete(r)

    verification = _get_or_create_project_verification(profile)
    verification.assessed_by = (data.get('assessed_by') or '').strip() or None

    db.session.commit()

    selected = ProjectSdg.query.filter_by(project_traceability_id=profile.id).all()
    return {
        "success": True,
        "message": "SDG project berhasil disimpan",
        "data": {
            "project_sdg_ids": [str(ps.sdg_id) for ps in selected],
            "verification": _serialize_project_verification(verification),
        }
    }, 200


def upload_project_sdg_evidence(project_id, file):
    project = Project.query.get(project_id)
    if not project:
        return {"success": False, "message": "Project tidak ditemukan"}, 404
    if not file or not file.filename:
        return {"success": False, "message": "File tidak ditemukan"}, 400

    profile = ProjectTraceabilityProfile.query.filter_by(project_id=project.id).first()
    if not profile:
        profile = ProjectTraceabilityProfile(project_id=project.id)
        db.session.add(profile)
        db.session.flush()

    file_url = save_file_locally(file, subfolder='evidence')
    original_name = file.filename
    ext = original_name.rsplit('.', 1)[1].lower() if '.' in original_name else ''

    verification = _get_or_create_project_verification(profile)
    verification.evidence_file_url = file_url
    verification.evidence_file_type = ext
    verification.assessment_date = datetime.utcnow()

    db.session.commit()

    return {
        "success": True,
        "message": "Bukti berhasil diupload",
        "data": _serialize_project_verification(verification),
    }, 200


def delete_project_sdg_evidence(project_id):
    project = Project.query.get(project_id)
    if not project:
        return {"success": False, "message": "Project tidak ditemukan"}, 404

    profile = ProjectTraceabilityProfile.query.filter_by(project_id=project.id).first()
    verification = ProjectSdgVerification.query.filter_by(project_traceability_id=profile.id).first() if profile else None
    if verification:
        verification.evidence_file_url = None
        verification.evidence_file_type = None
        db.session.commit()

    return {
        "success": True,
        "message": "Bukti berhasil dihapus",
        "data": _serialize_project_verification(verification),
    }, 200