import bcrypt
import string
import random
from app.db.database import db
from app.db.models import Company, User, Farm, Batch, CompanyPermission

def get_dashboard_stats():
    total_companies = Company.query.count() 
    active_companies = Company.query.filter_by(is_active= True).count()
    total_farms = Farm.query.count()
    total_users = User.query.count()
    total_batches = Batch.query.count()

    return {
        "success" : True,
        "data" : {
            "total_companies" : total_companies,
            "active_companies" : active_companies,
            "total_farms" : total_farms,
            "total_users" : total_users,
            "total_batches" : total_batches
        }
    }

def get_all_companies():
    companies = Company.query.order_by(Company.created_at.desc()).all()

    result = []
    for c in companies:
        result.append({
            "id" : str(c.id),
            "name" : c.name,
            "subscription_plan" : c.subscription_plan,
            "max_farms" : c.max_farms,
            "max_users" : c.max_users,
            "is_active" : c.is_active,
            "created_at" : c.created_at,
        })
    
    return ({"success": True, "data" : result})

def create_company(data):
    try:
        new_company = Company(
            name = data.get('name'),
            description = data.get('description'),
            address = data.get('address'),
            subscription_plan = data.get('subscription_plan', 'Starter'),
            max_farms = data.get('max_farms'),
            max_users = data.get('max_users'),
            branding_color = data.get('branding_color', '#2D6A4F')
        )
        db.session.add(new_company)
        db.session.flush() # Menyimpan sementara untuk mendapatkan new_company.id

        default_permissions = CompanyPermission(company_id=new_company.id)
        db.session.add(default_permissions)

        db.session.commit()
        return {"success": True, "messages": "Company berhasil dibuat", "data": {"id": str(new_company.id)}}
    
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": f"Gagal membuat company: {str(e)}"}
    
def update_company(company_id, data):
    try:
        company = Company.query.get(company_id)
        if not company:
            return {"success": False, "message": "Company tidak ditemukan"}
        
        company.name = data.get('name', company.name)
        company.description = data.get('description', company.description)
        company.address = data.get('address', company.address)
        company.subscription_plan = data.get('subscription_plan', company.subscription_plan)
        company.max_farms = data.get('max_farms', company.max_farms)
        company.max_users = data.get('max_users', company.max_users)

        if 'is_active' in data:
            company.is_active = data['is_active']
        
        company.branding_color = data.get('branding_color', company.branding_color)

        db.session.commit()
        return {"success": True, "message": "Company berhasil diupdate"}
    
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": f"Gagal mengupdate company: {str(e)}"}
    

def get_company_users(company_id):
    users = User.query.filter_by(company_id=company_id).all()
    result = []
    for u in users:
        result.append({
            "id": str(u.id),
            "username": u.username,
            "full_name": u.full_name,
            "phone": u.phone,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None
        })
    return {"success": True, "data": result}
    
def create_company_user(company_id, data):
    try:
        company = Company.query.get(company_id)
        if not company:
            return {"success": False, "message": "Company tidak ditemukan"}
            
        current_users_count = User.query.filter_by(company_id=company_id).count()
        if current_users_count >= company.max_users:
            return {"success": False, "message": f"Kuota penuh. Maksimal {company.max_users} user."}
            
        existing_user = User.query.filter_by(username=data.get('username')).first()
        if existing_user:
            return {"success": False, "message": "Username sudah digunakan, pilih yang lain."}
                
        role = data.get('role', 'manager')
        if role not in ['manager', 'board']:
            return {"success": False, "message": "Role harus 'manager' atau 'board'"}
                
        password = data.get('password')
        if not password or len(password) < 8:
            return {"success": False, "message": "Password minimal 8 karakter"}
                
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
            
        new_user = User(
            company_id=company_id,
            username=data.get('username'),
            full_name=data.get('full_name'),
            phone=data.get('phone'),
            role=role,
            password_hash=hashed_password
        )
        db.session.add(new_user)
        db.session.commit()
            
        return {"success": True, "message": "User berhasil dibuat", "data": {"id": str(new_user.id)}}
    
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": f"Gagal membuat user: {str(e)}"}
    
def reset_user_password(user_id, data):
    try:
        user = User.query.get(user_id)
        if not user:
            return {"success": False, "message": "User tidak ditemukan"}
            
        new_password = data.get('new_password')
        
        if not new_password:
            chars = string.ascii_letters + string.digits
            new_password = ''.join(random.choice(chars) for _ in range(8))
                
        salt = bcrypt.gensalt()
        user.password_hash = bcrypt.hashpw(new_password.encode('utf-8'), salt).decode('utf-8')
            
        db.session.commit()
        return {
            "success": True, 
            "message": "Password berhasil direset", 
            "data": {"new_password": new_password} # Password baru dikirimkan sebagai response agar Admin bisa melihatnya
        }
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": f"Gagal mereset password: {str(e)}"}
