import bcrypt
from app.core.security import token_required
from app.db.database import db
from app.db.models import User
from app.services.auth_service import authenticate_user
from flask import Blueprint, jsonify, request

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

# Default & tipe yang diizinkan; harus selaras dengan DEFAULT_SETTINGS di settingsHelper.js
DEFAULT_PREFERENCES = {
    'areaUnit': 'ha',
    'timezone': 'WIB',
    'ndviThreshold': 0.35,
    'language': 'id',
    'dateFormat': 'DD/MM/YYYY',
    'carbonUnit': 'Ton C',
    'currency': 'IDR (Rp)',
    'notifInApp': True,
    'notifAnomaly': True,
    'notifReports': True,
    'notifSystem': True,
    'auditLogRetention': '90d',
    'includeLocationMetadata': True,
}

PREFERENCE_CHOICES = {
    'areaUnit': {'ha', 'm2'},
    'timezone': {'WIB', 'WITA', 'WIT'},
    'language': {'id', 'en'},
    'dateFormat': {'DD/MM/YYYY', 'YYYY-MM-DD', 'DD MMM YYYY'},
    'carbonUnit': {'Ton C', 'Kg C'},
    'currency': {'IDR (Rp)', 'USD ($)'},
    'auditLogRetention': {'30d', '90d', '1y'},
}


def _merged_preferences(user):
    stored = user.preferences if isinstance(user.preferences, dict) else {}
    return {**DEFAULT_PREFERENCES, **{k: v for k, v in stored.items() if k in DEFAULT_PREFERENCES}}


def _validate_preference(key, value):
    default = DEFAULT_PREFERENCES[key]
    if key in PREFERENCE_CHOICES:
        return value in PREFERENCE_CHOICES[key]
    if isinstance(default, bool):
        return isinstance(value, bool)
    if key == 'ndviThreshold':
        return isinstance(value, (int, float)) and not isinstance(value, bool) and 0 <= value <= 1
    return False


@auth_bp.route('/settings', methods=['GET', 'PUT'])
@token_required
def settings(current_user):
    if request.method == 'GET':
        return jsonify({"success": True, "data": _merged_preferences(current_user)}), 200

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"success": False, "message": "Data tidak valid"}), 400

    # Key tak dikenal diabaikan, nilai tak valid ditolak
    updates = {k: v for k, v in data.items() if k in DEFAULT_PREFERENCES}
    invalid = [k for k, v in updates.items() if not _validate_preference(k, v)]
    if invalid:
        return jsonify({"success": False, "message": f"Nilai tidak valid: {', '.join(invalid)}"}), 400

    # Assign dict baru agar SQLAlchemy mendeteksi perubahan kolom JSON
    current_user.preferences = {**_merged_preferences(current_user), **updates}
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Preferensi berhasil disimpan",
        "data": _merged_preferences(current_user)
    }), 200
