from flask import Blueprint, request, jsonify
from app.services.auth_service import authenticate_user
from app.core.security import token_required
from app.db.models import User
from app.db.database import db
import bcrypt

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"success": False, "message": "Username dan password wajib diisi"}), 400
    
    result = authenticate_user(data.get('username'), data.get('password'))

    status_code = result.pop('status')
    return jsonify(result), status_code

@auth_bp.route('/profile', methods=['GET', 'PUT'])
@token_required
def profile(current_user):
    if request.method == 'GET':
        return jsonify({
            "success": True,
            "data": {
                "id": str(current_user.id),
                "username": current_user.username,
                "full_name": current_user.full_name,
                "email": current_user.email,
                "phone": current_user.phone,
                "role": current_user.role
            }
        }), 200
        
    elif request.method == 'PUT':
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Data tidak valid"}), 400
            
        if 'full_name' in data:
            current_user.full_name = data['full_name']
        if 'phone' in data:
            current_user.phone = data['phone']
            
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Profil berhasil diperbarui",
            "data": {
                "id": str(current_user.id),
                "username": current_user.username,
                "full_name": current_user.full_name,
                "email": current_user.email,
                "phone": current_user.phone,
                "role": current_user.role
            }
        }), 200

@auth_bp.route('/profile/password', methods=['PUT'])
@token_required
def update_password(current_user):
    data = request.get_json()
    if not data or not data.get('current_password') or not data.get('new_password'):
        return jsonify({"success": False, "message": "Password saat ini dan password baru wajib diisi"}), 400
        
    if not bcrypt.checkpw(data['current_password'].encode('utf-8'), current_user.password_hash.encode('utf-8')):
        return jsonify({"success": False, "message": "Password saat ini salah"}), 401
        
    if len(data['new_password']) < 6:
        return jsonify({"success": False, "message": "Password baru minimal 6 karakter"}), 400
        
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(data['new_password'].encode('utf-8'), salt)
    current_user.password_hash = hashed_password.decode('utf-8')
    
    db.session.commit()
    
    return jsonify({"success": True, "message": "Password berhasil diperbarui"}), 200