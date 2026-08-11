from flask import Blueprint, jsonify, request
from app.core.security import token_required, roles_required
from app.services import assessment_service as svc


assessment_bp = Blueprint('assessment_bp', __name__)

ASSESS_ROLES = ['super_admin', 'manager']


# ---------------------------------------------------------------
# SDG MASTER
# ---------------------------------------------------------------
@assessment_bp.route('/sdgs', methods=['GET'])
@token_required
@roles_required('super_admin')
def api_list_sdgs(current_user):
    return jsonify({"success": True, "data": svc.list_sdg_masters(active_only=False)}), 200


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