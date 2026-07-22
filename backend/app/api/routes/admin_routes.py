from flask import Blueprint, jsonify, request
from app.core.security import token_required, role_required
from app.services.admin_service import *

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
