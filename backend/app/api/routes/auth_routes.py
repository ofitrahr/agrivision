from flask import Blueprint, request, jsonify
from app.services.auth_service import authenticate_user

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"success": False, "message": "Username dan password wajib diisi"}), 400
    
    result = authenticate_user(data.get('username'), data.get('password'))

    status_code = result.pop('status')
    return jsonify(result), status_code