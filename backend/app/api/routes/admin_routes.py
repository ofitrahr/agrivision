from flask import Blueprint, jsonify
from app.core.security import token_required, role_required
from app.services.admin_service import get_dashboard_stats, get_all_companies

admin_bp = Blueprint('admin_bp', __name__)

@admin_bp.route('dashboard/stats', methods=['GET'])
@token_required
@role_required('super_admin')
def dashboard_stats(current_user):
    result = get_dashboard_stats
    return jsonify(result), 200

@admin_bp.route('companies', methods=['GET'])
@token_required
@role_required('super_admin')
def get_companies(current_user):
    result = get_all_companies
    return jsonify(result), 200

