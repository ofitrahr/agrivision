import bcrypt
import string
import random
from app.db.database import db
from app.db.models import Company, User, Farm, Batch, ProjectPermission, Project, ProjectSdg, ProjectSdgEvidence, ProjectTraceability
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
            "created_at" : c.created_at,
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
# TRACEABILITY - SDG ASSESSMENT
# ==========================================

def _serialize_traceability(trace):
    return {
        "id": str(trace.id) if trace else None,
        "assessed_by": trace.assessed_by if trace else None,
        "status": trace.status if trace else 'draft',
        "evidence": [
            {
                "id": str(ev.id),
                "file_url": ev.file_url,
                "file_name": ev.file_name,
                "file_type": ev.file_type
            }
            for ev in trace.evidence
        ] if trace else []
    }

def _get_or_create_traceability(project):
    trace = ProjectTraceability.query.filter_by(project_id=project.id).first()
    if not trace:
        trace = ProjectTraceability(project_id=project.id)
        db.session.add(trace)
        db.session.flush()
    return trace

def get_traceability_assessment_data(project_id):
    try:
        project = Project.query.get(project_id)
        if not project:
            return {"success": False, "message": "Project tidak ditemukan"}, 404

        trace = ProjectTraceability.query.filter_by(project_id=project_id).first()
        sdg_numbers = [s.sdg_number for s in ProjectSdg.query.filter_by(project_id=project_id).order_by(ProjectSdg.sdg_number).all()]

        return {
            "success": True,
            "data": {
                "project": {
                    "id": str(project.id),
                    "name": project.name,
                    "description": project.description,
                    "commodity": project.commodity,
                    "location": project.location,
                    "company_id": str(project.company_id),
                    "company_name": project.company.name if project.company else None
                },
                "assessment": _serialize_traceability(trace),
                "sdgs": sdg_numbers
            }
        }, 200
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": str(e)}, 500

def save_traceability_sdgs(project_id, data):
    try:
        project = Project.query.get(project_id)
        if not project:
            return {"success": False, "message": "Project tidak ditemukan"}, 404

        trace = _get_or_create_traceability(project)
        trace.assessed_by = (data.get('assessed_by') or '').strip() or None
        trace.status = data.get('status', 'draft') if data.get('status') in ('draft', 'published') else 'draft'

        # Sinkronisasi seleksi SDG
        submitted = data.get('sdg_numbers', [])
        submitted_set = set()
        for num in submitted:
            n = int(num)
            if not (1 <= n <= 17):
                return {"success": False, "message": f"SDG number tidak valid: {num}"}, 400
            submitted_set.add(n)
            if not ProjectSdg.query.filter_by(project_id=project_id, sdg_number=n).first():
                db.session.add(ProjectSdg(project_id=project_id, sdg_number=n))

        removed = ProjectSdg.query.filter(
            ProjectSdg.project_id == project_id,
            ~ProjectSdg.sdg_number.in_(submitted_set)
        ).all()
        for r in removed:
            db.session.delete(r)

        db.session.commit()

        sdg_numbers = [s.sdg_number for s in ProjectSdg.query.filter_by(project_id=project_id).order_by(ProjectSdg.sdg_number).all()]
        return {
            "success": True,
            "message": "Assessment SDG berhasil disimpan",
            "data": {"assessment": _serialize_traceability(trace), "sdgs": sdg_numbers}
        }, 200
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": str(e)}, 500

def add_sdg_evidence(project_id, file, current_user):
    try:
        project = Project.query.get(project_id)
        if not project:
            return {"success": False, "message": "Project tidak ditemukan"}, 404

        if not file or not file.filename:
            return {"success": False, "message": "File tidak ditemukan"}, 400

        trace = _get_or_create_traceability(project)
        file_url = save_file_locally(file, subfolder='evidence')

        original_name = file.filename
        ext = original_name.rsplit('.', 1)[1].lower() if '.' in original_name else ''

        evidence = ProjectSdgEvidence(
            traceability_id=trace.id,
            file_url=file_url,
            file_name=original_name,
            file_type=ext,
            uploaded_by=current_user.id if current_user else None
        )
        db.session.add(evidence)
        db.session.commit()

        return {
            "success": True,
            "message": "Bukti berhasil diupload",
            "data": {
                "id": str(evidence.id),
                "file_url": evidence.file_url,
                "file_name": evidence.file_name,
                "file_type": evidence.file_type
            }
        }, 200
    except ValueError as e:
        db.session.rollback()
        return {"success": False, "message": str(e)}, 400
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": str(e)}, 500

def delete_sdg_evidence(evidence_id):
    try:
        evidence = ProjectSdgEvidence.query.get(evidence_id)
        if not evidence:
            return {"success": False, "message": "Bukti tidak ditemukan"}, 404

        db.session.delete(evidence)
        db.session.commit()
        return {"success": True, "message": "Bukti berhasil dihapus"}, 200
    except Exception as e:
        db.session.rollback()
        return {"success": False, "message": str(e)}, 500
        

        