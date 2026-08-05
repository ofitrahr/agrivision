from flask import Blueprint, jsonify, request
from app.core.security import token_required, role_required
from app.services.upload_service import save_file_locally
from app.db.models import Company, Farm, Farmer
from app.db.database import db

manager_bp = Blueprint('manager_bp', __name__)

@manager_bp.route('/dashboard/stats', methods=['GET'])
@token_required
@role_required('manager')
def get_manager_stats(current_user):
    project_id = current_user.project_id
    project = current_user.project
    company_id = project.company_id if project else None
    
    farms_count = Farm.query.filter_by(project_id=project_id).count()
    farmers_count = Farmer.query.filter_by(company_id=company_id).count()
    
    # Calculate real production and revenue from FinancialRecord
    from app.db.models import FinancialRecord
    from sqlalchemy import func
    
    farm_ids = db.session.query(Farm.id).filter(Farm.project_id == project_id)
    
    stats = db.session.query(
        func.sum(FinancialRecord.total_production_kg).label('total_production_kg'),
        func.sum(FinancialRecord.estimated_revenue).label('total_revenue')
    ).filter(FinancialRecord.farm_id.in_(farm_ids)).first()
    
    total_production_ton = float(stats.total_production_kg or 0) / 1000
    total_revenue = float(stats.total_revenue or 0)
    
    return jsonify({
        'success': True,
        'data': {
            'total_farms': farms_count,
            'total_farmers': farmers_count,
            'total_production_ton': round(total_production_ton, 2),
            'total_revenue': total_revenue
        }
    }), 200

@manager_bp.route('/profile', methods=['GET', 'PUT'])
@token_required
@role_required('manager')
def manager_profile(current_user):
    project = current_user.project
    company = Company.query.get(project.company_id) if project else None
    if not company:
        return jsonify({'success': False, 'message': 'Company tidak ditemukan'}), 404
        
    if request.method == 'GET':
        return jsonify({
            'success': True,
            'data': {
                'id': company.id,
                'name': company.name,
                'description': company.description,
                'address': company.address,
                'logo_url': company.logo_url,
                'subscription_plan': company.subscription_plan
            }
        }), 200
        
    try:
        data = request.form
        
        if 'name' in data:
            company.name = data['name']
        if 'description' in data:
            company.description = data['description']
        if 'address' in data:
            company.address = data['address']
            
        if 'logo' in request.files:
            file = request.files['logo']
            if file.filename != '':
                try:
                    logo_url = save_file_locally(file, subfolder='logos')
                    company.logo_url = logo_url
                except ValueError as e:
                    return jsonify({'success': False, 'message': str(e)}), 400

        db.session.commit()
        return jsonify({'success': True, 'message': 'Profil berhasil diperbarui!', 'logo_url': company.logo_url}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@manager_bp.route('/farmers', methods=['GET', 'POST'])
@token_required
@role_required('manager')
def manager_farmers(current_user):
    project = current_user.project
    company_id = project.company_id if project else None
    
    if request.method == 'GET':
        farmers = Farmer.query.filter_by(company_id=company_id).all()
        data = [{
            'id': f.id,
            'name': f.name,
            'phone': f.phone,
            'photo_url': f.photo_url,
            'gender': f.gender,
            'age': f.age,
            'join_year': f.join_year,
            'farm_info': f.farm_info,
        } for f in farmers]
        return jsonify({'success': True, 'data': data}), 200
        
    # POST
    try:
        data = request.form
        name = data.get('name')
        phone = data.get('phone', '')
        gender = data.get('gender')
        age = data.get('age')
        join_year = data.get('join_year')
        farm_info = data.get('farm_info')
        
        if not name:
            return jsonify({'success': False, 'message': 'Nama petani wajib diisi'}), 400
            
        # Cek Redundansi Data
        if phone:
            existing_phone = Farmer.query.filter_by(company_id=company_id, phone=phone).first()
            if existing_phone:
                return jsonify({'success': False, 'message': f'Petani dengan nomor telepon {phone} sudah terdaftar'}), 400
        else:
            existing_name = Farmer.query.filter(
                Farmer.company_id == company_id,
                db.func.lower(Farmer.name) == name.lower().strip()
            ).first()
            if existing_name:
                return jsonify({'success': False, 'message': f'Petani dengan nama "{name}" sudah terdaftar'}), 400
            
        photo_url = None
        if 'photo' in request.files:
            file = request.files['photo']
            if file.filename != '':
                photo_url = save_file_locally(file, subfolder='farmers')
                
        new_farmer = Farmer(
            company_id=company_id,
            name=name.strip(),
            phone=phone if phone else None,
            photo_url=photo_url,
            gender=gender,
            age=int(age) if age else None,
            join_year=int(join_year) if join_year else None,
            farm_info=farm_info
        )
        db.session.add(new_farmer)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Petani berhasil ditambahkan'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@manager_bp.route('/farmers/<farmer_id>', methods=['PUT'])
@token_required
@role_required('manager')
def edit_farmer(current_user, farmer_id):
    project = current_user.project
    company_id = project.company_id if project else None
    farmer = Farmer.query.filter_by(id=farmer_id, company_id=company_id).first()
    if not farmer:
        return jsonify({'success': False, 'message': 'Petani tidak ditemukan'}), 404
        
    try:
        data = request.form
        
        if 'name' in data:
            farmer.name = data['name'].strip()
        if 'phone' in data:
            new_phone = data['phone'].strip()
            if new_phone and new_phone != farmer.phone:
                existing_phone = Farmer.query.filter_by(company_id=company_id, phone=new_phone).first()
                if existing_phone:
                    return jsonify({'success': False, 'message': f'Nomor telepon {new_phone} sudah digunakan oleh petani lain'}), 400
            farmer.phone = new_phone if new_phone else None
        if 'gender' in data:
            farmer.gender = data['gender']
        if 'age' in data and data['age']:
            farmer.age = int(data['age'])
        if 'join_year' in data and data['join_year']:
            farmer.join_year = int(data['join_year'])
        if 'farm_info' in data:
            farmer.farm_info = data['farm_info']
            
        if 'photo' in request.files:
            file = request.files['photo']
            if file.filename != '':
                photo_url = save_file_locally(file, subfolder='farmers')
                farmer.photo_url = photo_url
                
        db.session.commit()
        return jsonify({'success': True, 'message': 'Petani berhasil diperbarui'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@manager_bp.route('/farmers/<farmer_id>', methods=['DELETE'])
@token_required
@role_required('manager')
def delete_farmer(current_user, farmer_id):
    project = current_user.project
    company_id = project.company_id if project else None
    farmer = Farmer.query.filter_by(id=farmer_id, company_id=company_id).first()
    if not farmer:
        return jsonify({'success': False, 'message': 'Petani tidak ditemukan'}), 404
        
    try:
        db.session.delete(farmer)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Petani berhasil dihapus'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@manager_bp.route('/farms', methods=['GET'])
@token_required
@role_required('manager')
def manager_farms(current_user):
    project_id = current_user.project_id
    farms = Farm.query.filter_by(project_id=project_id).all()
    data = []
    for f in farms:
        from app.db.models import FarmCrop
        farm_farmers = f.farmers
        farm_crops = FarmCrop.query.filter_by(farm_id=f.id).all()
        data.append({
            'id': f.id,
            'name': f.name,
            'project_name': current_user.project.name if current_user.project else '-',
            'crop_variety': f.crop_variety,
            'farmers': [farmer.name for farmer in farm_farmers],
            'crops': [crop.crop_type for crop in farm_crops],
            'total_area_ha': float(f.total_area_ha) if f.total_area_ha else 0,
            'altitude': f.altitude if f.altitude else None,
            'established_year': f.created_at.strftime('%Y') if f.created_at else None,
            'agroforestry_system': getattr(f, 'agroforestry_system', None)
        })
    from app.db.models import ProjectPermission
    perms = ProjectPermission.query.filter_by(project_id=project_id).first()
    perms_data = {
        'can_access_ndvi': perms.can_access_ndvi if perms else True,
        'can_access_soc': perms.can_access_soc if perms else True,
        'can_access_biomass': perms.can_access_biomass if perms else True,
        'can_access_yield': perms.can_access_yield if perms else True,
        'can_access_soilnpk': perms.can_access_soilnpk if perms else True,
    }
    return jsonify({'success': True, 'data': data, 'permissions': perms_data}), 200

@manager_bp.route('/farms/<farm_id>/details', methods=['GET'])
@token_required
@role_required('manager')
def manager_farm_details(current_user, farm_id):
    farm = Farm.query.filter_by(id=farm_id, project_id=current_user.project_id).first()
    if not farm:
        return jsonify({'success': False, 'message': 'Lahan tidak ditemukan'}), 404

    from app.db.models import Farmer, FarmCrop
    farmers = farm.farmers
    crops = FarmCrop.query.filter_by(farm_id=farm.id).all()
    
    return jsonify({
        'success': True,
        'data': {
            'id': farm.id,
            'name': farm.name,
            'total_area_ha': float(farm.total_area_ha) if farm.total_area_ha else 0,
            'crop_variety': farm.crop_variety or '',
            'altitude': farm.altitude or '',
            'established_year': farm.created_at.strftime('%Y') if farm.created_at else '',
            'agroforestry_system': getattr(farm, 'agroforestry_system', None) or 'Agroforestri Organik',
            'farmers': [{'id': f.id, 'name': f.name} for f in farmers],
            'crops': [c.crop_type for c in crops]
        }
    }), 200

@manager_bp.route('/farms/<farm_id>/details', methods=['PUT'])
@token_required
@role_required('manager')
def manager_update_farm_details(current_user, farm_id):
    farm = Farm.query.filter_by(id=farm_id, project_id=current_user.project_id).first()
    if not farm:
        return jsonify({'success': False, 'message': 'Lahan tidak ditemukan'}), 404

    try:
        from app.db.models import Farmer, FarmCrop
        data = request.json

        if 'name' in data and data['name']:
            farm.name = data['name']
        if 'total_area_ha' in data:
            farm.total_area_ha = data['total_area_ha']
        if 'crop_variety' in data:
            farm.crop_variety = data['crop_variety']
        if 'altitude' in data:
            farm.altitude = data['altitude']
        if 'agroforestry_system' in data and hasattr(farm, 'agroforestry_system'):
            setattr(farm, 'agroforestry_system', data['agroforestry_system'])
        
        farmer_ids = data.get('farmer_ids', [])
        crop_types = data.get('crop_types', [])
        
        # Update Farmers
        valid_farmers = Farmer.query.filter(Farmer.id.in_(farmer_ids), Farmer.company_id == current_user.project.company_id).all()
        farm.farmers = valid_farmers
        
        # Update Crops
        FarmCrop.query.filter_by(farm_id=farm.id).delete()
        for c in crop_types:
            new_crop = FarmCrop(farm_id=farm.id, crop_type=c)
            db.session.add(new_crop)
            
        db.session.commit()

        from app.services.activity_service import log_activity
        log_activity(
            user_id=current_user.id,
            action='UPDATE_FARM',
            entity_type='Farm',
            entity_id=farm.id,
            details=f"Memperbarui informasi & penugasan lahan '{farm.name}'"
        )

        return jsonify({'success': True, 'message': 'Informasi lahan berhasil diperbarui'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@manager_bp.route('/farms/<farm_id>/map', methods=['GET'])
@token_required
@role_required('manager')
def get_manager_farm_map(current_user, farm_id):
    farm = Farm.query.filter_by(id=farm_id, project_id=current_user.project_id).first()
    if not farm:
        return jsonify({'success': False, 'message': 'Lahan tidak ditemukan'}), 404

    from app.services.gis_service import GISService
    from geoalchemy2.functions import ST_AsGeoJSON
    import json

    farm_geojson = None
    if farm.boundary is not None:
        geojson_str = db.session.scalar(ST_AsGeoJSON(farm.boundary))
        if geojson_str:
            farm_geojson = json.loads(geojson_str)

    try:
        map_html = GISService.generate_manager_map(
            farm_boundary_geojson=farm_geojson,
            existing_blocks_geojson=[]
        )
        return jsonify({
            'success': True,
            'data': {
                'html': map_html
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@manager_bp.route('/farms/<farm_id>/financials', methods=['GET', 'POST'])
@token_required
@role_required('manager')
def manager_farm_financials(current_user, farm_id):
    from app.db.models import FinancialRecord
    farm = Farm.query.filter_by(id=farm_id, project_id=current_user.project_id).first()
    if not farm:
        return jsonify({'success': False, 'message': 'Lahan tidak ditemukan'}), 404

    if request.method == 'GET':
        records = FinancialRecord.query.filter_by(farm_id=farm.id).order_by(FinancialRecord.created_at.desc()).all()
        data = []
        for r in records:
            data.append({
                'id': r.id,
                'period': r.period,
                'total_production_kg': float(r.total_production_kg) if r.total_production_kg else 0,
                'operational_cost': float(r.operational_cost) if r.operational_cost else 0,
                'estimated_revenue': float(r.estimated_revenue) if r.estimated_revenue else 0,
                'profit': float((r.estimated_revenue or 0) - (r.operational_cost or 0)),
                'notes': r.notes
            })
        return jsonify({'success': True, 'data': data}), 200

    # POST (Tambah laporan panen/keuangan baru)
    try:
        data = request.json
        period = data.get('period')
        if not period:
            return jsonify({'success': False, 'message': 'Periode (Bulan/Tahun) wajib diisi'}), 400

        record = FinancialRecord(
            company_id=current_user.project.company_id if current_user.project else None,
            farm_id=farm.id,
            period=period,
            total_production_kg=data.get('total_production_kg', 0),
            operational_cost=data.get('operational_cost', 0),
            estimated_revenue=data.get('estimated_revenue', 0),
            notes=data.get('notes', '')
        )
        db.session.add(record)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Laporan berhasil ditambahkan'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@manager_bp.route('/farms/<farm_id>/agronomy-map', methods=['GET'])
@token_required
@role_required('manager')
def get_agronomy_farm_map(current_user, farm_id):
    from app.db.models import ProjectPermission
    
    project_id = current_user.project_id
    
    # Cek izin akses agronomi modul
    perms = ProjectPermission.query.filter_by(project_id=project_id).first()
    if not perms or not perms.module_agronomy:
        return jsonify({'success': False, 'message': 'Perusahaan Anda tidak berlangganan Modul Agronomi'}), 403

    layer_type = request.args.get('layer', 'ndvi')
    
    if layer_type == 'soc':
        has_access = perms.can_access_soc if perms else True
    elif layer_type == 'biomass':
        has_access = perms.can_access_biomass if perms else True
    elif layer_type == 'yield':
        has_access = perms.can_access_yield if perms else True
    elif layer_type == 'soilnpk':
        has_access = perms.can_access_soilnpk if perms else True
    else:
        has_access = perms.can_access_ndvi if perms else True

    farm = Farm.query.filter_by(id=farm_id, project_id=current_user.project_id).first()
    if not farm:
        return jsonify({'success': False, 'message': 'Lahan tidak ditemukan'}), 404

    from app.services.gis_service import GISService
    from geoalchemy2.functions import ST_AsGeoJSON
    import json

    farm_geojson = None
    if farm.boundary is not None:
        geojson_str = db.session.scalar(ST_AsGeoJSON(farm.boundary))
        if geojson_str:
            farm_geojson = json.loads(geojson_str)

    try:
        map_html = GISService.generate_agronomy_map(
            farm_boundary_geojson=farm_geojson,
            existing_blocks_geojson=[],
            layer_type=layer_type,
            has_access=has_access
        )
        return jsonify({
            'success': True,
            'data': {
                'html': map_html
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@manager_bp.route('/farms/<farm_id>/harvests', methods=['GET', 'POST'])
@token_required
@role_required('manager')
def manager_farm_harvests(current_user, farm_id):
    from app.db.models import HarvestRecord
    farm = Farm.query.filter_by(id=farm_id, project_id=current_user.project_id).first()
    if not farm:
        return jsonify({'success': False, 'message': 'Lahan tidak ditemukan'}), 404

    if request.method == 'GET':
        records = HarvestRecord.query.filter_by(farm_id=farm.id).order_by(HarvestRecord.created_at.desc()).all()
        data = []
        for r in records:
            data.append({
                'id': r.id,
                'period': r.period,
                'yield_kg': float(r.yield_kg) if r.yield_kg else 0,
                'notes': r.notes
            })
        return jsonify({'success': True, 'data': data}), 200

    # POST (Tambah catatan panen)
    try:
        data = request.json
        period = data.get('period')
        yield_kg = data.get('yield_kg', 0)
        
        if not period:
            return jsonify({'success': False, 'message': 'Periode wajib diisi'}), 400

        record = HarvestRecord(
            company_id=current_user.project.company_id if current_user.project else None,
            farm_id=farm.id,
            period=period,
            yield_kg=yield_kg,
            notes=data.get('notes', '')
        )
        db.session.add(record)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Data panen blok berhasil ditambahkan'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@manager_bp.route('/activities', methods=['GET'])
@token_required
@role_required('manager')
def get_manager_activities(current_user):
    try:
        from app.db.models import ActivityLog, User, Project
        from app.services.activity_service import format_time_ago

        company_id = current_user.project.company_id if current_user.project else None
        if company_id:
            company_users = User.query.join(Project).filter(Project.company_id == company_id).all()
            user_ids = [u.id for u in company_users]
        else:
            user_ids = [current_user.id]

        limit_val = request.args.get('limit', default=50, type=int)
        logs = ActivityLog.query.filter(ActivityLog.user_id.in_(user_ids))\
                                .order_by(ActivityLog.created_at.desc())\
                                .limit(limit_val).all()

        data = []
        for log in logs:
            user = User.query.get(log.user_id) if log.user_id else None
            user_name = (user.full_name or user.username) if user else 'Sistem'

            icon = 'info'
            act = log.action.upper()
            if 'FARMER' in act or 'USER' in act or 'CREATE' in act:
                icon = 'group_add'
            elif 'MAP' in act or 'FARM' in act or 'GIS' in act:
                icon = 'map'
            elif 'FINANCIAL' in act or 'PAYMENT' in act:
                icon = 'payments'
            elif 'HARVEST' in act or 'CROP' in act:
                icon = 'description'
            elif 'LOGIN' in act:
                icon = 'login'

            data.append({
                'id': str(log.id),
                'icon': icon,
                'text': log.details or f"{log.action} {log.entity_type}",
                'subtext': f"Oleh {user_name} • {format_time_ago(log.created_at)}",
                'created_at': log.created_at.isoformat()
            })

        return jsonify({'success': True, 'data': data}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
