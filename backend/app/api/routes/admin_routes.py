from flask import Blueprint, jsonify, request
from app.core.security import token_required, role_required
from app.services.admin_service import *
from app.services.gis_service import GISService
from app.db.models import User, Company, Farm
from app.db.database import db


admin_bp = Blueprint('admin_bp', __name__)

@admin_bp.route('dashboard/stats', methods=['GET'])
@token_required
@role_required('super_admin')
def dashboard_stats(current_user):
    result = get_dashboard_stats()
    return jsonify(result), 200


@admin_bp.route('companies', methods=['GET'])
@token_required
@role_required('super_admin')
def get_companies(current_user):
    result = get_all_companies()
    return jsonify(result), 200


@admin_bp.route('companies', methods=['POST'])
@token_required
@role_required('super_admin')
def add_company(current_user):
    data = request.get_json()

    if not data or not data.get('name'):
        return jsonify({"success": False, "message": "Nama company wajib diisi"}), 400
    
    result = create_company(data)
    status_code = 201 if result.get('success') else 500
    return jsonify(result), status_code


@admin_bp.route('companies/<company_id>', methods=['PUT'])
@token_required
@role_required('super_admin')
def edit_company(current_user, company_id):
    data = request.get_json()

    if not data:
        return jsonify({"success": False, "message": "Data body tidak boleh kosong"}), 400
    
    result = update_company(company_id, data)

    if result.get('success'):
        status_code = 200
    elif "ditemukan" in result.get('message'):
        status_code = 404
    else:
        status_code = 500
            
    return jsonify(result), status_code

@admin_bp.route('/companies/<company_id>', methods=['DELETE'])
@token_required
@role_required('super_admin')
def delete_company(current_user, company_id):
    try:
        company = Company.query.get(company_id)
        if not company:
            return jsonify({'success': False, 'message': 'Perusahaan tidak ditemukan'}), 404
            
        db.session.delete(company)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Perusahaan berhasil dihapus'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# ==========================================
# SAAS / SUBSCRIPTION MODULE MANAGEMENT
# ==========================================

@admin_bp.route('/projects/<project_id>/permissions', methods=['GET', 'PUT'])
@token_required
@role_required('super_admin')
def manage_project_permissions(current_user, project_id):
    try:
        from app.db.models import ProjectPermission
        perms = ProjectPermission.query.filter_by(project_id=project_id).first()
        if not perms:
            perms = ProjectPermission(project_id=project_id)
            db.session.add(perms)
            db.session.commit()
            
        if request.method == 'GET':
            return jsonify({
                'success': True,
                'data': {
                    'id': perms.id,
                    'project_id': perms.project_id,
                    'module_gis': perms.module_gis,
                    'module_traceability': perms.module_traceability,
                    'module_agronomy': perms.module_agronomy,
                    'module_board_reports': perms.module_board_reports,
                    'can_access_ndvi': perms.can_access_ndvi,
                    'can_access_soc': perms.can_access_soc,
                    'can_access_yield': perms.can_access_yield,
                    'can_access_biomass': perms.can_access_biomass,
                    'can_access_soilnpk': perms.can_access_soilnpk
                }
            }), 200
            
        if request.method == 'PUT':
            data = request.json
            if 'module_gis' in data: perms.module_gis = data['module_gis']
            if 'module_traceability' in data: perms.module_traceability = data['module_traceability']
            if 'module_agronomy' in data: perms.module_agronomy = data['module_agronomy']
            if 'module_board_reports' in data: perms.module_board_reports = data['module_board_reports']
            if 'can_access_ndvi' in data: perms.can_access_ndvi = data['can_access_ndvi']
            if 'can_access_soc' in data: perms.can_access_soc = data['can_access_soc']
            if 'can_access_yield' in data: perms.can_access_yield = data['can_access_yield']
            if 'can_access_biomass' in data: perms.can_access_biomass = data['can_access_biomass']
            if 'can_access_soilnpk' in data: perms.can_access_soilnpk = data['can_access_soilnpk']
            
            db.session.commit()
            return jsonify({'success': True, 'message': 'Izin dan Modul berlangganan berhasil diperbarui'}), 200
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# ==========================================
# USER MANAGEMENT UNTUK PERUSAHAAN KLIEN
# ==========================================


@admin_bp.route('/companies/<company_id>/users', methods=['GET'])
@token_required
@role_required('super_admin')
def list_company_users(current_user, company_id):
    result = get_company_users(company_id)
    return jsonify(result), 200


@admin_bp.route('/companies/<company_id>/users', methods=['POST'])
@token_required
@role_required('super_admin')
def add_company_user(current_user, company_id):
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"success": False, "message": "Username dan password wajib diisi"}), 400
        
    result = create_company_user(company_id, data)
    status_code = 201 if result.get('success') else 400
    return jsonify(result), status_code


@admin_bp.route('/users/<user_id>/reset-password', methods=['POST'])
@token_required
@role_required('super_admin')
def reset_password(current_user, user_id):
    data = request.get_json(silent=True) or {}
    
    result = reset_user_password(user_id, data)
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code


@admin_bp.route('/users/<user_id>', methods=['PUT'])
@token_required
@role_required('super_admin')
def edit_user(current_user, user_id):
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "Data body tidak boleh kosong"}), 400
        
    result = update_user(user_id, data)
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code


@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@token_required
@role_required('super_admin')
def remove_user(current_user, user_id):
    result = delete_user(user_id)
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code

@admin_bp.route('/gis/map', methods=['GET'])
@token_required
@role_required('super_admin')
def get_global_map(current_user):
    try:
        map_html = GISService.generate_global_map()
        return jsonify({
            'success': True,
            'data': {
                'html': map_html
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/farms', methods=['POST'])
@token_required
@role_required('super_admin')
def create_farm(current_user):
    data = request.json
    try:
        geometry = data.get('geometry')
        coords = geometry['coordinates'][0]
        wkt_coords = ", ".join([f"{c[0]} {c[1]}" for c in coords])
        wkt_polygon = f"SRID=4326;POLYGON(({wkt_coords}))"

        new_farm = Farm(
            project_id=data.get('project_id'),
            name=data.get('name'),
            crop_variety=data.get('crop_variety'),
            total_area_ha=data.get('total_area_ha') or 0,
            boundary=wkt_polygon,
            created_by=current_user.id
        )
        
        db.session.add(new_farm)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Lahan berhasil disimpan dan diassign!'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 400


@admin_bp.route('/companies/<company_id>/projects', methods=['GET'])
@token_required
@role_required('super_admin')
def get_project(current_user, company_id):
    result = get_company_projects(company_id)
    return jsonify(result), 200

@admin_bp.route('/companies/<company_id>/projects', methods=['POST'])
@token_required
@role_required('super_admin')
def add_project(current_user, company_id):
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({"success": False, "message": "Nama project wajib diisi"}), 400
            
    result = create_project(company_id, data)
    status_code = 201 if result.get('success') else 400
    return jsonify(result), status_code

@admin_bp.route('/farms', methods=['GET'])
@token_required
@role_required('super_admin')
def admin_get_farms(current_user):
    from app.db.models import Project
    farms = Farm.query.order_by(Farm.created_at.desc()).all()
    data = []
    for f in farms:
        project = Project.query.get(f.project_id)
        project = Project.query.get(f.project_id)
        
        data.append({
            'id': f.id,
            'name': f.name,
            'project_name': project.name if project else '-',
            'company_name': project.company.name if project and project.company else '-',
            'total_area_ha': float(f.total_area_ha) if f.total_area_ha else 0,
            'crop_variety': f.crop_variety,
            'created_at': f.created_at.isoformat() if f.created_at else None
        })
    return jsonify({'success': True, 'data': data}), 200



@admin_bp.route('/farms/<farm_id>/map', methods=['GET'])
@token_required
@role_required('super_admin')
def get_admin_farm_map(current_user, farm_id):
    farm = Farm.query.filter_by(id=farm_id).first()
    if not farm:
        return jsonify({'success': False, 'message': 'Lahan tidak ditemukan'}), 404

    from app.services.gis_service import GISService
    from geoalchemy2.functions import ST_AsGeoJSON
    import json

    farm_geojson = None
    if farm.boundary is not None:
        geojson_str = db.session.scalar(ST_AsGeoJSON(farm.boundary))
        if geojson_str:
            farm_geojson = json.loads(geojson_str)

    try:
        is_thumbnail = request.args.get('thumbnail') == 'true'
        map_html = GISService.generate_manager_map(
            farm_boundary_geojson=farm_geojson,
            existing_blocks_geojson=[],
            thumbnail=is_thumbnail
        )
        return jsonify({
            'success': True,
            'data': {
                'html': map_html
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
