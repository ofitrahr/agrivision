import uuid

from app.core.security import roles_required, token_required
from app.db.database import db
from app.db.models import (
    FinancialRecord,
    GisLayer,
    HarvestRecord,
    Project,
    ProjectSdg,
    ProjectTraceabilityProfile,
    SdgMaster,
)
from app.services import assessment_service as svc
from app.services.assessment_service import get_or_create_profile
from flask import Blueprint, jsonify, request
from sqlalchemy import func

assessment_bp = Blueprint('assessment_bp', __name__)

ASSESS_ROLES = ['super_admin', 'manager']


# ---------------------------------------------------------------
# PUBLIC TRACEABILITY (no auth required - accessed via QR code)
# ---------------------------------------------------------------
@assessment_bp.route('/trace/<profile_id>', methods=['GET'])
def api_public_traceability(profile_id):
    """Public endpoint for traceability dashboard (accessed via QR code with profile ID).

    Menggunakan ProjectTraceabilityProfile ID (bukan project name) untuk menghindari duplikasi.
    Enforce: Profile harus status='published' untuk accessible publik.
    """
    try:
        profile_uuid = uuid.UUID(profile_id)
    except ValueError:
        return jsonify({"success": False, "message": "ID profile tidak valid"}), 400

    profile = ProjectTraceabilityProfile.query.get(profile_uuid)
    if not profile:
        return jsonify({"success": False, "message": "Profile traceability tidak ditemukan"}), 404

    # ✅ ENFORCE: Check publish status
    if profile.status != 'published':
        return jsonify({
            "success": False,
            "message": "Profile traceability belum dipublikasikan oleh manager"
        }), 403

    project = profile.project
    if not project:
        return jsonify({"success": False, "message": "Project tidak ditemukan"}), 404

    project_sdgs = []
    for ps in ProjectSdg.query.filter_by(project_traceability_id=profile.id).all():
        sdg = ps.sdg_master
        project_sdgs.append({
            "goal_number": sdg.goal_number,
            "name": sdg.name,
            "description": sdg.description,
            "image_url": sdg.image_url,
        })

    # Collect unique farmers from all farms in this project
    farmers_data = []
    seen_farmer_ids = set()
    for farm in project.farms:
        for farmer in farm.farmers:
            if farmer.id not in seen_farmer_ids:
                seen_farmer_ids.add(farmer.id)
                farmers_data.append({
                    "name": farmer.name,
                    "gender": farmer.gender,
                    "photo_url": farmer.photo_url,
                    "age": farmer.age,
                    "join_year": farmer.join_year,
                    "farm_name": farm.name,
                })

    total_farmers = len(farmers_data)
    female_count = sum(1 for f in farmers_data if f.get('gender') and f['gender'].lower() in ['perempuan', 'female', 'f', 'wanita'])
    male_count = total_farmers - female_count

    # Collect unique commodities from farm crops
    commodities = set()
    for farm in project.farms:
        for crop in farm.crops:
            if crop.crop_type:
                commodities.add(crop.crop_type.strip())

    # Collect unique farm locations
    locations = set()
    for farm in project.farms:
        if farm.location:
            locations.add(farm.location.strip())

    # Fallback ke project-level jika farm tidak punya data
    commodity_str = ', '.join(sorted(commodities)) if commodities else (project.commodity or '')
    location_str = ', '.join(sorted(locations)) if locations else (project.location or '')

    farm_ids = [f.id for f in project.farms]
    total_area_ha = sum(float(f.total_area_ha) for f in project.farms if f.total_area_ha)

    annual_yield_kg = 0.0
    estimated_revenue = 0.0
    soc_mean = None
    if farm_ids:
        annual_yield_kg = float(db.session.query(
            func.coalesce(func.sum(HarvestRecord.yield_kg), 0)
        ).filter(HarvestRecord.farm_id.in_(farm_ids)).scalar() or 0)

        estimated_revenue = float(db.session.query(
            func.coalesce(func.sum(FinancialRecord.estimated_revenue), 0)
        ).filter(FinancialRecord.farm_id.in_(farm_ids)).scalar() or 0)

        soc_mean = db.session.query(func.avg(GisLayer.numerical_value)).filter(
            GisLayer.farm_id.in_(farm_ids),
            GisLayer.parameter_type == 'soc',
        ).scalar()

    carbon_stock_ton = round(float(soc_mean) * total_area_ha, 1) if soc_mean and total_area_ha else 0.0

    practices = sorted({f.agroforestry_system.strip() for f in project.farms if f.agroforestry_system})
    farm_practice = ', '.join(practices) if practices else 'Agroforestry'

    return jsonify({
        "success": True,
        "data": {
            "project": {
                "id": str(project.id),
                "name": project.name,
                "commodity": commodity_str,
                "location": location_str,
                "company_name": project.company.name if project.company else None,
            },
            "profile": {
                "id": str(profile.id),
                "title": profile.title,
                "tagline": profile.tagline,
                "origin_story": profile.origin_story,
                "description": profile.description,
                "hero_image_url": profile.hero_image_url,
                "status": profile.status,
                "social_narrative": profile.social_narrative or '',
                "economic_narrative": profile.economic_narrative or '',
                "environmental_narrative": profile.environmental_narrative or '',
            },
            "sdgs": project_sdgs,
            "farmers": farmers_data,
            "farmer_stats": {
                "total": total_farmers,
                "female": female_count,
                "male": male_count,
            },
            "economic_metrics": {
                "active_farm_area_ha": round(total_area_ha, 2),
                "annual_yield_kg": round(annual_yield_kg, 2),
                "estimated_revenue": round(estimated_revenue, 2),
            },
            "environmental_metrics": {
                "land_area_ha": round(total_area_ha, 2),
                "carbon_stock_ton": carbon_stock_ton,
                "farm_practice": farm_practice,
            },
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
    result, status = svc.save_project_sdg_selection(project_id, data, current_user=current_user)
    return jsonify(result), status


@assessment_bp.route('/projects/<project_id>/project-sdgs/verification/evidence', methods=['POST'])
@token_required
@roles_required(*ASSESS_ROLES)
def api_upload_project_sdg_evidence(current_user, project_id):
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'File tidak ditemukan pada request'}), 400
    result, status = svc.upload_project_sdg_evidence(project_id, request.files['file'])
    return jsonify(result), status


@assessment_bp.route('/projects/<project_id>/project-sdgs/verification/evidence/<evidence_id>', methods=['DELETE'])
@token_required
@roles_required(*ASSESS_ROLES)
def api_delete_project_sdg_evidence_file(current_user, project_id, evidence_id):
    result, status = svc.delete_project_sdg_evidence_file(project_id, evidence_id)
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