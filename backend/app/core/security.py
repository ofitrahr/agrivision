from functools import wraps
from flask import jsonify, request, current_app
import jwt
from app.db.models import User

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({'success': False, 'message': 'Token tidak ditemukan!'}), 401

        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user-id'])

            if not current_user or not current_user.is_active:
                raise Exception("User tidak valid atau tidak aktif")
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'message': 'Token Expired, silahkan login ulang!'}), 401
        except Exception as e:
            return jsonify({'success': False, 'message': "Token tidak valid!"}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

def role_required(required_role):
    def decorated(f):
        @wraps(f)
        def decorated(current_user, *args, **kwargs):
            if current_user.role != required_role:
                return jsonify({'success': False, 'message': 'Akses ditolak. Fitur ini hanya untuk role tententu.'}), 403
            return f(current_user, *args, **kwargs)
        return decorated
    return decorated

