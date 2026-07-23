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


@admin_bp.route('companies', methods=['PUT'])
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
    # Pakai or {} agar tidak error kalau request bodynya kosong
    data = request.get_json(silent=True) or {}
    
    result = reset_user_password(user_id, data)
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
            company_id=data.get('company_id'),
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