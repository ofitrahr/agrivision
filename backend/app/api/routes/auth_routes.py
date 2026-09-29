import bcrypt
from app.core.security import token_required
from app.db.database import db
from app.db.models import User
from app.services.auth_service import authenticate_user
from app.services.login_rate_limit_service import (
    clear_failed_logins,
    get_login_retry_after,
    record_failed_login,
)
from flask import Blueprint, current_app, jsonify, make_response, request

auth_bp = Blueprint('auth_bp', __name__)

# ---------------------------------------------------------------
# AUTHENTICATION
# ---------------------------------------------------------------
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"success": False, "message": "Username dan password wajib diisi"}), 400

    if not isinstance(data.get('username'), str) or not isinstance(data.get('password'), str):
        return jsonify({"success": False, "message": "Format username atau password tidak valid"}), 400
    
    ip_address = request.remote_addr or 'unknown'
    retry_after = get_login_retry_after(ip_address, data.get('username'))
    if retry_after:
        response = make_response(jsonify({
            "success": False,
            "message": f"Terlalu banyak percobaan login gagal. Coba lagi dalam {retry_after} detik."
        }), 429)
        response.headers['Retry-After'] = str(retry_after)
        return response

    result = authenticate_user(data.get('username'), data.get('password'))

    status_code = result.pop('status')
    if status_code == 200:
        clear_failed_logins(data.get('username'))
    else:
        record_failed_login(ip_address, data.get('username'))
    token = result.pop('token', None)
    response = make_response(jsonify(result), status_code)
    if token:
        response.set_cookie(
            current_app.config['AUTH_COOKIE_NAME'],
            token,
            max_age=current_app.config['AUTH_COOKIE_MAX_AGE'],
            httponly=True,
            secure=current_app.config['AUTH_COOKIE_SECURE'],
            samesite=current_app.config['AUTH_COOKIE_SAMESITE'],
            path='/',
        )
    return response

@auth_bp.route('/logout', methods=['POST'])
def logout():
    response = make_response(jsonify({"success": True, "message": "Berhasil logout"}), 200)
    response.delete_cookie(
        current_app.config['AUTH_COOKIE_NAME'],
        path='/',
        secure=current_app.config['AUTH_COOKIE_SECURE'],
        samesite=current_app.config['AUTH_COOKIE_SAMESITE'],
        httponly=True,
    )
    return response

# ---------------------------------------------------------------
# USER PROFILE & PASSWORD
# ---------------------------------------------------------------
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

# ---------------------------------------------------------------
# USER SETTINGS
# ---------------------------------------------------------------
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

    updates = {k: v for k, v in data.items() if k in DEFAULT_PREFERENCES}
    invalid = [k for k, v in updates.items() if not _validate_preference(k, v)]
    if invalid:
        return jsonify({"success": False, "message": f"Nilai tidak valid: {', '.join(invalid)}"}), 400

    current_user.preferences = {**_merged_preferences(current_user), **updates}
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Preferensi berhasil disimpan",
        "data": _merged_preferences(current_user)
    }), 200
