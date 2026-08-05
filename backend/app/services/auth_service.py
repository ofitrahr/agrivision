import bcrypt
import jwt
from datetime import datetime, timedelta
from flask import current_app
from app.db.models import User

def authenticate_user(username, password):
    user = User.query.filter_by(username=username).first()

    if not user:
        return {"success": False, "message": "Username tidak ditemukan", "status": 404}
    
    if not user.is_active:
        return {"success": False, "message": "Akun tidak aktif", "status": 403}

    if user.role != 'superadmin' and user.project and user.project.company:
        if not user.project.company.is_active:
            return {"success": False, "message": "Akun / Perusahaan sudah tidak aktif", "status": 403}
    
    if bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        payload = {
            'user-id': str(user.id),
            'project_id': str(user.project_id) if user.project_id else None,
            'company_id': str(user.project.company_id) if user.project_id and user.project else None,
            'username': user.username,
            'role': user.role,
            'exp': datetime.utcnow() + timedelta(days=1)
        }
        token = jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')

        try:
            from app.services.activity_service import log_activity
            log_activity(
                user_id=user.id,
                action='LOGIN',
                entity_type='User',
                entity_id=user.id,
                details=f"User {user.full_name or user.username} berhasil login ke sistem"
            )
        except Exception as e:
            print("Error logging login activity:", e)

        return {
            "success": True,
            "token": token,
            "user": {
                "id": str(user.id),
                "user": user.username,
                "role": user.role,
                "full_name": user.full_name
            },
            "status": 200
        }
    else:
        return {"success": False, "message": "Password salah", "status": 401}