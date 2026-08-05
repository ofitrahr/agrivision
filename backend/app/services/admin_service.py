import bcrypt
import string
import random
from datetime import datetime
from app.db.database import db
from app.db.models import Company, User, Farm, Batch, ProjectPermission, Project, ProjectTraceability, Sdg, CompanySdg, CompanySdgVerification
from app.services.upload_service import save_file_locally

def get_dashboard_stats():
    total_companies = Company.query.count() 
    active_companies = Company.query.filter_by(is_active= True).count()
    total_farms = Farm.query.count()
    total_users = User.query.count()
    total_batches = Batch.query.count()
    total_projects = Project.query.count()
    total_area_ha = db.session.query(db.func.sum(Farm.total_area_ha)).scalar() or 0

    return {
        "success" : True,
        "data" : {
            "total_companies" : total_companies,
            "active_companies" : active_companies,
            "total_farms" : total_farms,
            "total_users" : total_users,
            "total_batches" : total_batches,
            "total_projects": total_projects,
            "total_area_ha": float(total_area_ha)
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
            "created_at" : c.created_at.isoformat() if c.created_at else None,
        })
    
    return ({"success": True, "data" : result})

def create_company(data):
    try:
        new_company = Company(
            name = data.get('name'),
            description = data.get('description'),
            address = data.get('address'),
            subscription_plan = data.get('subscription_plan', 'Basic'),
            max_farms = data.get('max_farms'),
            max_users = data.get('max_users'),
            branding_color = data.get('branding_color', '#2D6A4F')
        )
        db.session.add(new_company)
        db.session.flush() # Menyimpan sementara untuk mendapatkan new_company.id

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
    # Mengambil semua user yang terdaftar di project-project milik company ini
    users = User.query.join(Project).filter(Project.company_id == company_id).all()
    
    result = []
    for u in users:
        result.append({
            "id": str(u.id),
            "project_id": str(u.project_id),
            "project_name": u.project.name if u.project else "-",
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
            
        # 1. Pastikan project_id dikirim dari frontend
        project_id = data.get('project_id')
        if not project_id:
            return {"success": False, "message": "Pilih Project terlebih dahulu untuk user ini"}
            
        # 2. Cek apakah project valid dan milik company ini
        project = Project.query.filter_by(id=project_id, company_id=company_id).first()
        if not project:
            return {"success": False, "message": "Project tidak valid atau bukan milik company ini"}
            
        # 3. Cek batasan kuota user per company
        current_users_count = User.query.join(Project).filter(Project.company_id == company_id).count()
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
            
        # 4. Simpan ke Database dengan project_id
        new_user = User(
            project_id=project_id, 
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
            "data": {"new_password": new_password} 
        }
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": f"Gagal mereset password: {str(e)}"}

def update_user(user_id, data):
    try:
        user = User.query.get(user_id)
        if not user:
            return {"success": False, "message": "User tidak ditemukan"}
            
        user.username = data.get('username', user.username)
        user.full_name = data.get('full_name', user.full_name)
        user.phone = data.get('phone', user.phone)
        user.role = data.get('role', user.role)
        
        if 'project_id' in data:
            user.project_id = data['project_id']
            
        db.session.commit()
        return {"success": True, "message": "User berhasil diupdate"}
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": f"Gagal mengupdate user: {str(e)}"}

def delete_user(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return {"success": False, "message": "User tidak ditemukan"}
            
        db.session.delete(user)
        db.session.commit()
        return {"success": True, "message": "User berhasil dihapus"}
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": f"Gagal menghapus user: {str(e)}"}

def get_company_projects(company_id):
    project = Project.query.filter_by(company_id = company_id).order_by(Project.created_at.desc()).all()
    result = []
    for p in project:
        result.append({
            "id": str(p.id),
            "company_id": str(p.company_id),
            "name": p.name,
            "description": p.description,
            "commodity": p.commodity,
            "location": p.location,
            "created_at": p.created_at.isoformat() if p.created_at  else None
        })
    return {"success": True, "data": result}

def create_project(company_id, data):
    try:
        company = Company.query.get(company_id)
        if not company:
            return {"success": False, "message": "Company tidak ditemukan"}

        new_project = Project(
            company_id = company_id,
            name = data.get('name'),
            description = data.get('description'),
            commodity = data.get('commodity'),
            location = data.get('location')
        )

        db.session.add(new_project)
        db.session.flush()

        default_permissions = ProjectPermission(project_id=new_project.id)
        db.session.add(default_permissions)

        db.session.commit()
        return {"success": True, "message": "Project berhasil dibuat", "data": {"id": str(new_project.id)}}
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": f"Gagal membuat project: {str(e)}"}    


# ==========================================
# TRACEABILITY - SDG ASSESSMENT (COMPANY LEVEL)
# ==========================================

def _get_or_create_verification(company):
    verification = CompanySdgVerification.query.filter_by(company_id=company.id).first()
    if not verification:
        verification = CompanySdgVerification(company_id=company.id)
        db.session.add(verification)
        db.session.flush()
    return verification

def _serialize_verification(verification):
    return {
        "assessed_by": verification.assessed_by if verification else None,
        "evidence_file_url": verification.evidence_file_url if verification else None,
        "evidence_file_type": verification.evidence_file_type if verification else None,
        "assessment_date": verification.assessment_date.isoformat() if verification and verification.assessment_date else None
    }

def get_company_sdg_assessment_data(company_id):
    try:
        company = Company.query.get(company_id)
        if not company:
            return {"success": False, "message": "Company tidak ditemukan"}, 404

        sdg_catalog = Sdg.query.order_by(Sdg.code).all()
        sdg_catalog.sort(key=lambda s: int(s.code))
        sdg_catalog.sort(key=lambda s: int(s.code))
        selected = CompanySdg.query.filter_by(company_id=company_id).all()
        selected_map = {cs.sdg_id: cs for cs in selected}
        verification = CompanySdgVerification.query.filter_by(company_id=company_id).first()

        sdgs = []
        for sdg in sdg_catalog:
            cs = selected_map.get(sdg.id)
            sdgs.append({
                "id": str(sdg.id),
                "code": sdg.code,
                "title": sdg.title,
                "goal": sdg.goal,
                "image_url": sdg.image_url,
                "icon": sdg.icon,
                "selected": cs is not None,
                "description": cs.description if cs else None,
                "display_order": cs.display_order if cs else 0
            })

        return {
            "success": True,
            "data": {
                "company": {
                    "id": str(company.id),
                    "name": company.name,
                    "description": company.description,
                    "address": company.address,
                    "logo_url": company.logo_url,
                    "subscription_plan": company.subscription_plan
                },
                "sdgs": sdgs,
                "verification": _serialize_verification(verification)
            }
        }, 200
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": str(e)}, 500

def save_company_sdg_assessment(company_id, data):
    try:
        company = Company.query.get(company_id)
        if not company:
            return {"success": False, "message": "Company tidak ditemukan"}, 404

        submitted = data.get('sdgs', [])
        submitted_ids = set()

        for item in submitted:
            sdg_id = item.get('sdg_id')
            sdg = Sdg.query.get(sdg_id)
            if not sdg:
                return {"success": False, "message": "SDG tidak valid"}, 400

            submitted_ids.add(sdg_id)

            cs = CompanySdg.query.filter_by(company_id=company_id, sdg_id=sdg_id).first()
            if not cs:
                cs = CompanySdg(company_id=company_id, sdg_id=sdg_id)
                db.session.add(cs)

            cs.description = (item.get('description') or '').strip() or None
            cs.display_order = item.get('display_order', 0) or 0

        removed = CompanySdg.query.filter(
            CompanySdg.company_id == company_id,
            ~CompanySdg.sdg_id.in_(submitted_ids)
        ).all()
        for r in removed:
            db.session.delete(r)

        verification = _get_or_create_verification(company)
        verification.assessed_by = (data.get('assessed_by') or '').strip() or None

        db.session.commit()

        return {
            "success": True,
            "message": "Assessment SDG perusahaan berhasil disimpan",
            "data": {
                "sdg_ids": [str(s.sdg_id) for s in CompanySdg.query.filter_by(company_id=company_id).order_by(CompanySdg.display_order).all()],
                "verification": _serialize_verification(verification)
            }
        }, 200
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": str(e)}, 500

def upload_company_sdg_verification(company_id, file, current_user):
    try:
        company = Company.query.get(company_id)
        if not company:
            return {"success": False, "message": "Company tidak ditemukan"}, 404

        if not file or not file.filename:
            return {"success": False, "message": "File tidak ditemukan"}, 400

        file_url = save_file_locally(file, subfolder='evidence')

        original_name = file.filename
        ext = original_name.rsplit('.', 1)[1].lower() if '.' in original_name else ''

        verification = _get_or_create_verification(company)
        verification.evidence_file_url = file_url
        verification.evidence_file_type = ext
        verification.assessment_date = datetime.utcnow()

        db.session.commit()

        return {
            "success": True,
            "message": "Bukti berhasil diupload",
            "data": _serialize_verification(verification)
        }, 200
    except ValueError as e:
        db.session.rollback()
        return {"success": False, "message": str(e)}, 400
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": str(e)}, 500

def delete_company_sdg_verification(company_id):
    try:
        company = Company.query.get(company_id)
        if not company:
            return {"success": False, "message": "Company tidak ditemukan"}, 404

        verification = CompanySdgVerification.query.filter_by(company_id=company_id).first()
        if verification:
            verification.evidence_file_url = None
            verification.evidence_file_type = None
            db.session.commit()

        return {"success": True, "message": "Bukti berhasil dihapus"}, 200
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": str(e)}, 500

def get_project_traceability_data(project_id):
    try:
        project = Project.query.get(project_id)
        if not project:
            return {"success": False, "message": "Project tidak ditemukan"}, 404

        trace = ProjectTraceability.query.filter_by(project_id=project_id).first()

        return {
            "success": True,
            "data": {
                "project": {
                    "id": str(project.id),
                    "name": project.name,
                    "commodity": project.commodity,
                    "location": project.location,
                    "company_id": str(project.company_id),
                    "company_name": project.company.name if project.company else None
                },
                "traceability": {
                    "id": str(trace.id) if trace else None,
                    "hero_image_url": trace.hero_image_url if trace else None,
                    "origin_story": trace.origin_story if trace else None,
                    "social_description": trace.social_description if trace else None,
                    "economic_description": trace.economic_description if trace else None,
                    "environmental_description": trace.environmental_description if trace else None,
                    "is_published": trace.is_published if trace else False
                }
            }
        }, 200
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": str(e)}, 500

def save_project_traceability(project_id, data):
    try:
        project = Project.query.get(project_id)
        if not project:
            return {"success": False, "message": "Project tidak ditemukan"}, 404

        trace = ProjectTraceability.query.filter_by(project_id=project_id).first()
        if not trace:
            trace = ProjectTraceability(project_id=project_id)
            db.session.add(trace)

        trace.hero_image_url = data.get('hero_image_url', trace.hero_image_url)
        trace.origin_story = data.get('origin_story', trace.origin_story)
        trace.social_description = data.get('social_description', trace.social_description)
        trace.economic_description = data.get('economic_description', trace.economic_description)
        trace.environmental_description = data.get('environmental_description', trace.environmental_description)
        if 'is_published' in data:
            trace.is_published = bool(data['is_published'])

        db.session.commit()

        return {
            "success": True,
            "message": "Traceability project berhasil disimpan",
            "data": {
                "is_published": trace.is_published
            }
        }, 200
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": str(e)}, 500
        

        