import uuid
from flask import Blueprint, jsonify, request
from app.core.security import token_required, roles_required
from app.services import assessment_service as svc
from app.db.models import Project, ProjectTraceabilityProfile, ProjectSdg, SdgMaster


assessment_bp = Blueprint('assessment_bp', __name__)

ASSESS_ROLES = ['super_admin', 'manager']


# ---------------------------------------------------------------
# PUBLIC TRACEABILITY (no auth required - accessed via QR code)
# ---------------------------------------------------------------
@assessment_bp.route('/public/trace/<project_ref>', methods=['GET'])
def api_public_traceability(project_ref):
    """Public endpoint for traceability dashboard (QR code scan)."""
    try:
        project_uuid = uuid.UUID(project_ref)
        project = Project.query.filter(
            (Project.id == project_uuid) | (Project.name == project_ref)
        ).first()
    except ValueError:
        project = Project.query.filter_by(name=project_ref).first()
    if not project:
        return jsonify({"success": False, "message": "Project tidak ditemukan"}), 404

    profile = ProjectTraceabilityProfile.query.filter_by(project_id=project.id).first()
    project_sdgs = []
    if profile:
        for ps in ProjectSdg.query.filter_by(project_traceability_id=profile.id).all():
            sdg = ps.sdg_master
            project_sdgs.append({
                "goal_number": sdg.goal_number,
                "name": sdg.name,
                "description": sdg.description,
                "image_url": sdg.image_url,
            })

    return jsonify({
        "success": True,
        "data": {
            "project": {
                "id": str(project.id),
                "name": project.name,
                "commodity": project.commodity,
                "location": project.location,
                "company_name": project.company.name if project.company else None,
            },
            "profile": {
                "title": profile.title if profile else None,
                "tagline": profile.tagline if profile else None,
                "origin_story": profile.origin_story if profile else None,
                "description": profile.description if profile else None,
                "hero_image_url": profile.hero_image_url if profile else None,
                "status": profile.status if profile else 'draft',
            },
            "sdgs": project_sdgs,
        }
    }), 200


# ---------------------------------------------------------------
# SDG MASTER
# ---------------------------------------------------------------
@assessment_bp.route('/sdgs', methods=['GET'])
@token_required
@roles_required('super_admin')
def api_list_sdgs(current_user):
    return jsonify({"success": True, "data": svc.list_sdg_masters(active_only=False)}), 200


# ---------------------------------------------------------------
# SDG INDICATOR (metadata 302 indikator, plan revisi #19.2)
# ---------------------------------------------------------------
@assessment_bp.route('/indicators', methods=['GET'])
@token_required
@roles_required(*ASSESS_ROLES)
def api_list_indicators(current_user):
    applicable_only = request.args.get('applicable') == '1'
    result, status = svc.list_sdg_indicators(applicable_only=applicable_only)
    return jsonify(result), status


# ---------------------------------------------------------------
# QUESTIONNAIRE
# ---------------------------------------------------------------
@assessment_bp.route('/questionnaires', methods=['GET'])
@token_required
@roles_required(*ASSESS_ROLES)
def api_list_questionnaires(current_user):
    return jsonify({"success": True, "data": svc.list_questionnaires()}), 200


@assessment_bp.route('/questionnaires/<questionnaire_id>', methods=['GET'])
@token_required
@roles_required(*ASSESS_ROLES)
def api_get_questionnaire(current_user, questionnaire_id):
    data = svc.serialize_questionnaire(questionnaire_id)
    if not data:
        return jsonify({"success": False, "message": "Questionnaire tidak ditemukan"}), 404
    return jsonify({"success": True, "data": data}), 200


@assessment_bp.route('/questionnaires/active', methods=['GET'])
@token_required
@roles_required(*ASSESS_ROLES)
def api_active_questionnaire(current_user):
    q = svc.get_active_questionnaire()
    if not q:
        return jsonify({"success": False, "message": "Belum ada questionnaire aktif"}), 200
    return jsonify({"success": True, "data": svc.serialize_questionnaire(q.id)}), 200


# ---------------------------------------------------------------
# PROJECT TRACEABILITY PROFILE
# ---------------------------------------------------------------
@assessment_bp.route('/projects/<project_id>/traceability', methods=['GET'])
@token_required
@roles_required(*ASSESS_ROLES)
def api_get_project_traceability(current_user, project_id):
    result, status = svc.get_project_traceability_data(project_id)
    return jsonify(result), status


@assessment_bp.route('/projects/<project_id>/traceability', methods=['PUT'])
@token_required
@roles_required(*ASSESS_ROLES)
def api_save_project_traceability(current_user, project_id):
    result, status = svc.save_project_traceability_profile(project_id, request.get_json(silent=True) or {})
    return jsonify(result), status


# ---------------------------------------------------------------
# PROJECT SDG SELECTION (checklist admin/traceability)
# ---------------------------------------------------------------
@assessment_bp.route('/projects/<project_id>/project-sdgs', methods=['GET'])
@token_required
@roles_required(*ASSESS_ROLES)
def api_get_project_sdg_selection(current_user, project_id):
    result, status = svc.get_project_sdg_selection(project_id)
    return jsonify(result), status


@assessment_bp.route('/projects/<project_id>/project-sdgs', methods=['PUT'])
@token_required
@roles_required(*ASSESS_ROLES)
def api_save_project_sdg_selection(current_user, project_id):
    data = request.get_json(silent=True) or {}
    result, status = svc.save_project_sdg_selection(project_id, data)
    return jsonify(result), status


@assessment_bp.route('/projects/<project_id>/project-sdgs/verification/evidence', methods=['POST'])
@token_required
@roles_required(*ASSESS_ROLES)
def api_upload_project_sdg_evidence(current_user, project_id):
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'File tidak ditemukan pada request'}), 400
    result, status = svc.upload_project_sdg_evidence(project_id, request.files['file'])
    return jsonify(result), status


@assessment_bp.route('/projects/<project_id>/project-sdgs/verification/evidence', methods=['DELETE'])
@token_required
@roles_required(*ASSESS_ROLES)
def api_delete_project_sdg_evidence(current_user, project_id):
    result, status = svc.delete_project_sdg_evidence(project_id)
    return jsonify(result), status


# ---------------------------------------------------------------
# ASSESSMENT
# ---------------------------------------------------------------
@assessment_bp.route('/projects/<project_id>/assessments', methods=['POST'])
@token_required
@roles_required(*ASSESS_ROLES)
def api_start_assessment(current_user, project_id):
    data = request.get_json(silent=True) or {}
    result, status = svc.start_assessment(project_id, data.get('questionnaire_id'), current_user, data)
    return jsonify(result), status


@assessment_bp.route('/projects/<project_id>/assessments', methods=['GET'])
@token_required
@roles_required(*ASSESS_ROLES)
def api_list_project_assessments(current_user, project_id):
    result, status = svc.get_project_traceability_data(project_id)
    return jsonify(result), status


@assessment_bp.route('/assessments/<assessment_id>', methods=['GET'])
@token_required
@roles_required(*ASSESS_ROLES)
def api_get_assessment(current_user, assessment_id):
    result, status = svc.get_assessment_detail(assessment_id)
    return jsonify(result), status


@assessment_bp.route('/assessments/<assessment_id>/answers', methods=['POST'])
@token_required
@roles_required(*ASSESS_ROLES)
def api_submit_answers(current_user, assessment_id):
    result, status = svc.submit_answers(assessment_id, current_user, request.get_json(silent=True) or {})
    return jsonify(result), status


@assessment_bp.route('/assessments/<assessment_id>/status', methods=['PUT'])
@token_required
@roles_required(*ASSESS_ROLES)
def api_change_status(current_user, assessment_id):
    data = request.get_json(silent=True) or {}
    result, status = svc.change_assessment_status(assessment_id, data.get('status'))
    return jsonify(result), status


@assessment_bp.route('/assessments/<assessment_id>', methods=['DELETE'])
@token_required
@roles_required(*ASSESS_ROLES)
def api_delete_assessment(current_user, assessment_id):
    result, status = svc.delete_assessment(assessment_id)
    return jsonify(result), status


# ---------------------------------------------------------------
# COMPANY SDG SUMMARY
# ---------------------------------------------------------------
@assessment_bp.route('/companies/<company_id>/sdg-summary', methods=['GET'])
@token_required
@roles_required(*ASSESS_ROLES)
def api_company_sdg_summary(current_user, company_id):
    result, status = svc.get_company_sdg_summary(company_id)
    return jsonify(result), status