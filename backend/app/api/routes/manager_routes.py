from flask import Blueprint, jsonify, request, send_file, current_app
import os
import base64
from datetime import datetime
from app.core.security import token_required, role_required
from app.services.upload_service import save_file_locally
from app.db.models import Company, Farm, Farmer
from app.db.database import db
from app.services.report_service import ReportService

manager_bp = Blueprint('manager_bp', __name__)

@manager_bp.route('/dashboard/stats', methods=['GET'])
@token_required
@role_required('manager')
def get_manager_stats(current_user):
    project_id = current_user.project_id
    project = current_user.project
    company_id = project.company_id if project else None

    from app.db.models import FinancialRecord, EsgMetric, Farm as FarmModel
    from sqlalchemy import func

    farms = FarmModel.query.filter_by(project_id=project_id).all()
    farm_ids_list = [f.id for f in farms]

    farms_count = len(farm_ids_list)
    farmers_count = Farmer.query.filter_by(company_id=company_id).count()

    # Total luas lahan (Ha) dari semua farm
    total_area_ha = float(
        db.session.query(func.sum(FarmModel.total_area_ha))
        .filter(FarmModel.project_id == project_id)
        .scalar() or 0
    )

    # Komoditas utama: ambil dari crop_variety farm pertama yang punya data
    primary_commodity = None
    for farm in farms:
        if farm.crop_variety:
            primary_commodity = farm.crop_variety
            break
        if farm.crops:
            crop = next((c for c in farm.crops if c.crop_type), None)
            if crop:
                primary_commodity = crop.crop_type
                break

    # Revenue dan produksi dari FinancialRecord
    fin_stats = db.session.query(
        func.sum(FinancialRecord.total_production_kg).label('total_production_kg'),
        func.sum(FinancialRecord.estimated_revenue).label('total_revenue')
    ).filter(FinancialRecord.farm_id.in_(farm_ids_list)).first()

    total_production_ton = float(fin_stats.total_production_kg or 0) / 1000
    total_revenue = float(fin_stats.total_revenue or 0)

    # Tren revenue per periode (untuk sparkline chart)
    revenue_trend_rows = db.session.query(
        FinancialRecord.period,
        func.sum(FinancialRecord.estimated_revenue).label('revenue')
    ).filter(
        FinancialRecord.farm_id.in_(farm_ids_list)
    ).group_by(FinancialRecord.period).order_by(FinancialRecord.period).all()
    revenue_trend = [float(r.revenue or 0) for r in revenue_trend_rows]

    # Serapan karbon (carbon_footprint) dari EsgMetric
    carbon_total = db.session.query(
        func.sum(EsgMetric.carbon_footprint)
    ).filter(EsgMetric.farm_id.in_(farm_ids_list)).scalar()
    total_carbon_ton = float(carbon_total or 0)

    return jsonify({
        'success': True,
        'data': {
            'total_farms': farms_count,
            'total_farmers': farmers_count,
            'total_area_ha': round(total_area_ha, 2),
            'primary_commodity': primary_commodity,
            'total_production_ton': round(total_production_ton, 2),
            'total_revenue': total_revenue,
            'revenue_trend': revenue_trend,
            'total_carbon_ton': round(total_carbon_ton, 2),
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

@manager_bp.route('/traceability/profile', methods=['GET', 'POST'])
@token_required
@role_required('manager')
def manager_traceability_profile(current_user):
    """Get atau update traceability profile untuk manager project.

    GET: Retrieve profile data dengan project_id
    POST: Update profile data (title, tagline, origin_story, description, status)
    """
    from app.db.models import ProjectTraceabilityProfile
    from app.services.assessment_service import get_or_create_profile, save_project_traceability_profile

    project = current_user.project
    if not project:
        return jsonify({'success': False, 'message': 'Manager belum terhubung ke project'}), 400

    profile = get_or_create_profile(project.id)

    if request.method == 'GET':
        return jsonify({
            'success': True,
            'data': {
                'project_id': str(project.id),
                'profile_id': str(profile.id),
                'title': profile.title,
                'tagline': profile.tagline,
                'origin_story': profile.origin_story or '',
                'description': profile.description or '',
                'hero_image_url': profile.hero_image_url,
                'status': profile.status,
                'social_narrative': profile.social_narrative or '',
                'economic_narrative': profile.economic_narrative or '',
                'environmental_narrative': profile.environmental_narrative or '',
            }
        }), 200

    # POST: Update profile (supports JSON and multipart/form-data for hero image)
    try:
        if request.content_type and 'multipart/form-data' in request.content_type:
            data = request.form.to_dict()
            if 'hero_image' in request.files:
                file = request.files['hero_image']
                if file.filename:
                    allowed_image_exts = {'png', 'jpg', 'jpeg', 'webp'}
                    ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
                    if ext not in allowed_image_exts:
                        return jsonify({'success': False, 'message': 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.'}), 400

                    file.seek(0, 2)
                    file_size = file.tell()
                    file.seek(0)
                    if file_size > 5 * 1024 * 1024:
                        return jsonify({'success': False, 'message': 'Ukuran file terlalu besar. Maksimum 5 MB.'}), 400

                    try:
                        from PIL import Image
                        img = Image.open(file)
                        width, height = img.size
                        file.seek(0)
                        if width < 800 or height < 400:
                            return jsonify({'success': False, 'message': 'Resolusi gambar terlalu kecil. Minimum 800 x 400 px.'}), 400
                        if width > 4000 or height > 4000:
                            return jsonify({'success': False, 'message': 'Resolusi gambar terlalu besar. Maksimum 4000 x 4000 px.'}), 400
                    except Exception:
                        file.seek(0)

                    hero_url = save_file_locally(file, subfolder='traceability')
                    if hero_url:
                        data['hero_image_url'] = hero_url
        else:
            data = request.get_json(silent=True) or {}
        result, status_code = save_project_traceability_profile(project.id, data)
        return jsonify(result), status_code
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


def _parse_year(val):
    if not val:
        return None
    try:
        y = int(float(str(val).strip()))
        return y
    except (ValueError, TypeError):
        return None

@manager_bp.route('/farmers', methods=['GET', 'POST'])
@token_required
@role_required('manager')
def manager_farmers(current_user):
    project = current_user.project
    company_id = project.company_id if project else None
    
    if not company_id:
        return jsonify({'success': False, 'message': 'Akun manager belum terhubung ke perusahaan/proyek.'}), 400

    if request.method == 'GET':
        farmers = Farmer.query.filter_by(company_id=company_id).all()
        data = [{
            'id': f.id,
            'name': f.name,
            'phone': f.phone,
            'photo_url': f.photo_url,
            'gender': f.gender,
            'birth_year': f.birth_year,
            'age': f.age,
            'join_year': f.join_year,
            'farm_info': f.farm_info,
        } for f in farmers]
        return jsonify({'success': True, 'data': data}), 200
        
    # POST
    try:
        data = request.form
        name = data.get('name')
        raw_phone = data.get('phone', '')
        phone = raw_phone.strip() if raw_phone and raw_phone.strip() else None
        gender = data.get('gender')
        raw_birth_year = data.get('birth_year') or data.get('age')
        raw_join_year = data.get('join_year')
        farm_info = data.get('farm_info')
        
        if not name or not name.strip():
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
                
        parsed_birth_year = _parse_year(raw_birth_year)
        parsed_join_year = _parse_year(raw_join_year)

        new_farmer = Farmer(
            company_id=company_id,
            name=name.strip(),
            phone=phone,
            photo_url=photo_url,
            gender=gender,
            birth_year=parsed_birth_year,
            join_year=parsed_join_year,
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
        if 'birth_year' in data or 'age' in data:
            raw_by = data.get('birth_year') or data.get('age')
            farmer.birth_year = _parse_year(raw_by)
        if 'join_year' in data:
            farmer.join_year = _parse_year(data.get('join_year'))
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
            'location': f.location or (current_user.project.location if current_user.project else '-'),
            'project_name': current_user.project.name if current_user.project else '-',
            'crop_variety': f.crop_variety,
            'farmers': [farmer.name for farmer in farm_farmers],
            'crops': [
                {
                    'id': str(crop.id),
                    'crop_type': crop.crop_type,
                    'area_ha': float(crop.area_ha) if crop.area_ha is not None else 0.0
                } for crop in farm_crops
            ],
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
            'location': farm.location or '',
            'total_area_ha': float(farm.total_area_ha) if farm.total_area_ha else 0,
            'crop_variety': farm.crop_variety or '',
            'altitude': farm.altitude or '',
            'established_year': farm.created_at.strftime('%Y') if farm.created_at else '',
            'agroforestry_system': getattr(farm, 'agroforestry_system', None) or 'Agroforestri Organik',
            'farmers': [{'id': f.id, 'name': f.name} for f in farmers],
            'crops': [
                {
                    'id': str(c.id),
                    'crop_type': c.crop_type,
                    'area_ha': float(c.area_ha) if c.area_ha is not None else 0.0
                } for c in crops
            ]
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

        farm_total_area = float(farm.total_area_ha) if farm.total_area_ha else 0.0
        if 'total_area_ha' in data:
            farm_total_area = float(data['total_area_ha']) if data['total_area_ha'] is not None else 0.0
            farm.total_area_ha = farm_total_area

        if 'name' in data and data['name']:
            farm.name = data['name']
        if 'location' in data['name']:
            farm.location = data['location']
        if 'crop_variety' in data:
            farm.crop_variety = data['crop_variety']
        if 'altitude' in data:
            farm.altitude = data['altitude']
        if 'agroforestry_system' in data and hasattr(farm, 'agroforestry_system'):
            setattr(farm, 'agroforestry_system', data['agroforestry_system'])
        
        farmer_ids = data.get('farmer_ids', [])
        
        # Parse crops 
        raw_crops = data.get('crops', [])
        if not raw_crops and 'crop_types' in data:
            raw_crops = [{'crop_type': ct, 'area_ha': 0.0} for ct in data.get('crop_types', [])]

        parsed_crops = []
        total_crops_area = 0.0
        for item in raw_crops:
            if isinstance(item, str):
                c_type = item.strip()
                c_area = 0.0
            elif isinstance(item, dict):
                c_type = str(item.get('crop_type', '')).strip()
                try:
                    c_area = float(item.get('area_ha', 0) or 0)
                except (ValueError, TypeError):
                    c_area = 0.0
            else:
                continue

            if not c_type:
                continue
            if c_area < 0:
                return jsonify({'success': False, 'message': f'Luas komoditas {c_type} tidak boleh bernilai negatif'}), 400

            parsed_crops.append({'crop_type': c_type, 'area_ha': round(c_area, 2)})
            total_crops_area += c_area

        total_crops_area = round(total_crops_area, 2)
        if farm_total_area > 0 and total_crops_area > (farm_total_area + 0.0001):
            return jsonify({
                'success': False,
                'message': f'Total luas komoditas ({total_crops_area} Ha) melebihi total luas lahan ({farm_total_area} Ha)'
            }), 400
        
        # Update Farmers
        valid_farmers = Farmer.query.filter(Farmer.id.in_(farmer_ids), Farmer.company_id == current_user.project.company_id).all()
        farm.farmers = valid_farmers
        
        # Update Crops
        FarmCrop.query.filter_by(farm_id=farm.id).delete()
        for c in parsed_crops:
            new_crop = FarmCrop(farm_id=farm.id, crop_type=c['crop_type'], area_ha=c['area_ha'])
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

    is_thumbnail = request.args.get('thumbnail', 'false').lower() == 'true'

    try:
        map_html = GISService.generate_manager_map(
            farm_boundary_geojson=farm_geojson,
            existing_blocks_geojson=[],
            thumbnail=is_thumbnail
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
        # Query sample points dari GisLayer untuk dikirim ke peta
        from app.db.models import GisLayer
        from geoalchemy2.functions import ST_X, ST_Y
        
        latest_period = request.args.get('period', 'Q1_2026')
        gis_rows = GisLayer.query.filter_by(
            farm_id=farm_id,
            parameter_type=layer_type,
            period=latest_period
        ).all()

        sample_points = []
        for row in gis_rows:
            if row.coordinate is not None and row.numerical_value is not None:
                lon = db.session.scalar(ST_X(row.coordinate))
                lat = db.session.scalar(ST_Y(row.coordinate))
                if lat is not None and lon is not None:
                    sample_points.append({
                        'lat': float(lat),
                        'lon': float(lon),
                        'value': float(row.numerical_value)
                    })

        map_html = GISService.generate_agronomy_map(
            farm_boundary_geojson=farm_geojson,
            existing_blocks_geojson=[],
            layer_type=layer_type,
            has_access=has_access,
            sample_points=sample_points if sample_points else None
        )
        return jsonify({
            'success': True,
            'data': {
                'html': map_html
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@manager_bp.route('/farms/<farm_id>/agronomy-stats', methods=['GET'])
@token_required
@role_required('manager')
def get_agronomy_stats(current_user, farm_id):
    from app.db.models import ProjectPermission, GisLayer
    import statistics
    import math

    project_id = current_user.project_id

    perms = ProjectPermission.query.filter_by(project_id=project_id).first()
    if not perms or not perms.module_agronomy:
        return jsonify({'success': False, 'message': 'Perusahaan Anda tidak berlangganan Modul Agronomi'}), 403

    layer_type = request.args.get('layer', 'ndvi')
    period = request.args.get('period', 'Q1_2026')

    # Cek permission per layer
    layer_perm_map = {
        'soc': 'can_access_soc',
        'biomass': 'can_access_biomass',
        'yield': 'can_access_yield',
        'soilnpk': 'can_access_soilnpk',
        'nitrogen': 'can_access_soilnpk',
        'phosphorus': 'can_access_soilnpk',
        'potassium': 'can_access_soilnpk',
    }
    perm_key = layer_perm_map.get(layer_type, 'can_access_ndvi')
    if not getattr(perms, perm_key, True):
        return jsonify({'success': False, 'message': f'Akses ke layer {layer_type.upper()} tidak tersedia'}), 403

    farm = Farm.query.filter_by(id=farm_id, project_id=project_id).first()
    if not farm:
        return jsonify({'success': False, 'message': 'Lahan tidak ditemukan'}), 404

    # Query data GisLayer untuk periode yang diminta
    rows = GisLayer.query.filter_by(
        farm_id=farm_id,
        parameter_type=layer_type,
        period=period
    ).all()

    values = [float(r.numerical_value) for r in rows if r.numerical_value is not None]
    
    # Calculate previous period for change delta
    all_periods = ['Q1_2025', 'Q2_2025', 'Q3_2025', 'Q4_2025', 'Q1_2026']
    prev_period = None
    if period in all_periods:
        idx = all_periods.index(period)
        if idx > 0:
            prev_period = all_periods[idx - 1]

    if not values:
        return jsonify({
            'success': True,
            'data': {
                'layer': layer_type,
                'period': period,
                'has_data': False,
                'stats': {'mean': None, 'min': None, 'max': None, 'std_dev': None, 'total_count': 0, 'change': None},
                'anomaly': {'count': 0, 'total': 0, 'percent': 0.0},
                'histogram': [],
                'trend': [],
                'sensor_data': None,
                'forecast': None
            }
        }), 200

    # Statistik dasar
    mean_val = statistics.mean(values)
    min_val = min(values)
    max_val = max(values)
    std_val = statistics.stdev(values) if len(values) > 1 else 0.0
    
    # Calculate change
    change = None
    if prev_period:
        prev_rows = GisLayer.query.filter_by(farm_id=farm_id, parameter_type=layer_type, period=prev_period).all()
        prev_vals = [float(r.numerical_value) for r in prev_rows if r.numerical_value is not None]
        if prev_vals:
            prev_mean = statistics.mean(prev_vals)
            change = mean_val - prev_mean

    total_count = len(values)
    area_per_pixel = float(farm.total_area_ha) / total_count if total_count > 0 and farm.total_area_ha else 0

    # Histogram 10 bin
    histogram = []
    if max_val > min_val:
        bin_width = (max_val - min_val) / 10
        bins = [{'bin': round(min_val + i * bin_width, 3), 'count': 0} for i in range(10)]
        for v in values:
            idx = min(int((v - min_val) / bin_width), 9)
            bins[idx]['count'] += 1
        histogram = [{'bin': str(b['bin']), 'count': b['count'], 'area_ha': round(b['count'] * area_per_pixel, 2)} for b in bins]

    # Anomali
    anomaly_rows = [r for r in rows if r.is_anomaly]
    anomaly_count = len(anomaly_rows)
    anomaly_percent = round((anomaly_count / total_count) * 100, 2) if total_count > 0 else 0.0

    # Tren lintas waktu
    period_labels = {
        'Q1_2025': 'Jan-Mar 2025', 'Q2_2025': 'Apr-Jun 2025',
        'Q3_2025': 'Jul-Sep 2025', 'Q4_2025': 'Okt-Des 2025', 'Q1_2026': 'Jan-Mar 2026'
    }
    trend = []
    for p in all_periods:
        period_rows = GisLayer.query.filter_by(
            farm_id=farm_id, parameter_type=layer_type, period=p
        ).all()
        period_vals = [float(r.numerical_value) for r in period_rows if r.numerical_value is not None]
        if period_vals:
            trend.append({
                'period': period_labels.get(p, p),
                'period_id': p,
                'value': round(statistics.mean(period_vals), 4)
            })

    # Sensor Data
    sensor_data = None
    if layer_type in ['nitrogen', 'phosphorus', 'potassium', 'soilnpk']:
        from app.db.models import SensorData
        sensor = SensorData.query.filter_by(farm_id=farm_id, period=period).first()
        if sensor:
            sensor_data = {
                'ph': float(sensor.ph) if sensor.ph else None,
                'temperature': float(sensor.temperature) if sensor.temperature else None,
                'ec': float(sensor.ec) if sensor.ec else None,
                'humidity': float(sensor.humidity) if sensor.humidity else None,
            }
            
        # Get N, P, K averages for KPI strip
        n_rows = GisLayer.query.filter_by(farm_id=farm_id, parameter_type='nitrogen', period=period).all()
        p_rows = GisLayer.query.filter_by(farm_id=farm_id, parameter_type='phosphorus', period=period).all()
        k_rows = GisLayer.query.filter_by(farm_id=farm_id, parameter_type='potassium', period=period).all()
        
        n_vals = [float(r.numerical_value) for r in n_rows if r.numerical_value is not None]
        p_vals = [float(r.numerical_value) for r in p_rows if r.numerical_value is not None]
        k_vals = [float(r.numerical_value) for r in k_rows if r.numerical_value is not None]
        
        if sensor_data is None:
            sensor_data = {}
        sensor_data['nitrogen_mean'] = round(statistics.mean(n_vals), 2) if n_vals else None
        sensor_data['phosphorus_mean'] = round(statistics.mean(p_vals), 2) if p_vals else None
        sensor_data['potassium_mean'] = round(statistics.mean(k_vals), 2) if k_vals else None

    # Forecast (Yield)
    forecast = None
    if layer_type == 'yield':
        # Get forecast for next period
        next_period_idx = all_periods.index(period) + 1 if period in all_periods else -1
        if next_period_idx > 0 and next_period_idx <= len(all_periods):
            # For simplicity, if we are at Q1_2026, next is Q2_2026
            next_p = 'Q2_2026' if period == 'Q1_2026' else all_periods[next_period_idx]
            fc_rows = GisLayer.query.filter_by(farm_id=farm_id, parameter_type='yield_forecast', period=next_p).all()
            fc_vals = [float(r.numerical_value) for r in fc_rows if r.numerical_value is not None]
            if fc_vals:
                forecast = {
                    'period': next_p,
                    'value': round(statistics.mean(fc_vals), 4)
                }

    return jsonify({
        'success': True,
        'data': {
            'layer': layer_type,
            'period': period,
            'has_data': True,
            'stats': {
                'mean': round(mean_val, 4),
                'min': round(min_val, 4),
                'max': round(max_val, 4),
                'std_dev': round(std_val, 4),
                'total_count': total_count,
                'change': round(change, 4) if change is not None else None
            },
            'anomaly': {
                'count': anomaly_count,
                'total': total_count,
                'percent': anomaly_percent
            },
            'histogram': histogram,
            'trend': trend,
            'sensor_data': sensor_data,
            'forecast': forecast
        }
    }), 200

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


# ---------------------------------------------------------------
# TRACEABILITY QR CODE GENERATION
# ---------------------------------------------------------------
@manager_bp.route('/projects/<project_id>/traceability/qr/generate', methods=['POST'])
@token_required
@role_required('manager')
def generate_traceability_qr(current_user, project_id):
    """Generate QR code untuk public traceability profile (on-demand, no DB storage).

    QR berisi link ke: /public/trace/{profile_id}
    Menggunakan ProjectTraceabilityProfile ID (bukan project name).
    """
    from app.services.assessment_service import generate_traceability_qr as gen_qr

    # Validasi bahwa current user adalah manager dari project ini
    if str(current_user.project_id) != str(project_id):
        return jsonify({"success": False, "message": "Tidak memiliki akses ke project ini"}), 403

    result, status_code = gen_qr(project_id)
    return jsonify(result), status_code


@manager_bp.route('/traceability/preview', methods=['GET'])
@token_required
@role_required('manager')
def manager_traceability_preview(current_user):
    """Preview traceability profile sebelum publish (manager only).

    Endpoint ini memungkinkan manager melihat preview profile mereka
    SEBELUM status diubah ke 'published'. Ini berguna untuk testing
    QR code dan link sebelum di-share ke konsumen.

    Return data sama seperti public endpoint, tapi tanpa check publish status.
    """
    from app.db.models import ProjectTraceabilityProfile, ProjectSdg

    project = current_user.project
    if not project:
        return jsonify({'success': False, 'message': 'Manager belum terhubung ke project'}), 400

    profile = ProjectTraceabilityProfile.query.filter_by(project_id=project.id).first()
    if not profile:
        return jsonify({"success": False, "message": "Profile traceability tidak ditemukan"}), 404

    project_sdgs = []
    for ps in ProjectSdg.query.filter_by(project_traceability_id=profile.id).all():
        sdg = ps.sdg_master
        project_sdgs.append({
            "goal_number": sdg.goal_number,
            "name": sdg.name,
            "description": sdg.description,
            "image_url": sdg.image_url,
        })

    return jsonify({
        "success": True,
        "data": {
            "project": {
                "id": str(project.id),
                "name": project.name,
                "commodity": project.commodity,
                "location": project.location,
                "company_name": project.company.name if project.company else None,
            },
            "profile": {
                "id": str(profile.id),
                "title": profile.title,
                "tagline": profile.tagline,
                "origin_story": profile.origin_story,
                "description": profile.description,
                "hero_image_url": profile.hero_image_url,
                "status": profile.status,
                "social_narrative": profile.social_narrative or '',
                "economic_narrative": profile.economic_narrative or '',
                "environmental_narrative": profile.environmental_narrative or '',
            },
            "sdgs": project_sdgs,
        }
    }), 200


@manager_bp.route('/reports', methods=['GET', 'POST'])
@token_required
@role_required('manager')
def manager_reports(current_user):
    from app.db.models import DocumentReport
    company_id = current_user.project.company_id if current_user.project else None
    if not company_id:
        return jsonify({'success': False, 'message': 'Akun belum terhubung ke perusahaan'}), 400

    if request.method == 'GET':
        reports = DocumentReport.query.filter_by(company_id=company_id)\
            .order_by(DocumentReport.created_at.desc()).all()
        data = [{
            'id': str(r.id),
            'title': r.title,
            'type': r.report_type,
            'farmName': r.farm_name,
            'period': r.period,
            'format': r.format.upper() if r.format else 'PDF',
            'status': 'Tersedia' if r.status == 'available' else r.status,
            'date': r.created_at.strftime('%Y-%m-%d') if r.created_at else None,
        } for r in reports]
        return jsonify({'success': True, 'data': data}), 200

    # POST
    try:
        payload = request.json
        title = payload.get('title')
        report_type = payload.get('report_type', 'comprehensive')
        farm_id = payload.get('farm_id')
        farm_name = payload.get('farm_name', 'Semua Lahan')
        period = payload.get('period', '')
        fmt = payload.get('format', 'pdf')

        if not title:
            return jsonify({'success': False, 'message': 'Judul laporan wajib diisi'}), 400

        import uuid as uuid_pkg
        valid_farm_uuid = None
        if farm_id and farm_id != 'all' and ',' not in str(farm_id):
            try:
                valid_farm_uuid = uuid_pkg.UUID(str(farm_id).strip())
            except (ValueError, AttributeError):
                valid_farm_uuid = None

        report = DocumentReport(
            company_id=company_id,
            farm_id=valid_farm_uuid,
            title=title,
            report_type=report_type,
            farm_name=farm_name,
            period=period,
            format=fmt.lower(),
            status='available',
        )
        db.session.add(report)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Laporan berhasil dibuat',
            'data': {
                'id': str(report.id),
                'title': report.title,
                'type': report.report_type,
                'farmName': report.farm_name,
                'period': report.period,
                'format': report.format.upper(),
                'status': 'Tersedia',
                'date': report.created_at.strftime('%Y-%m-%d'),
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@manager_bp.route('/available-periods', methods=['GET'])
@token_required
@role_required('manager')
def get_available_periods(current_user):
    from app.db.models import GisLayer
    project_id = current_user.project_id
    farm_ids = [f.id for f in Farm.query.filter_by(project_id=project_id).all()]

    if not farm_ids:
        return jsonify({'success': True, 'data': []}), 200

    rows = db.session.query(GisLayer.period)\
        .filter(GisLayer.farm_id.in_(farm_ids))\
        .filter(GisLayer.parameter_type != 'yield_forecast')\
        .distinct()\
        .all()

    period_label_map = {
        'Q1': 'Jan - Mar', 'Q2': 'Apr - Jun',
        'Q3': 'Jul - Sep', 'Q4': 'Okt - Des',
    }
    
    def parse_period_for_sort(p):
        try:
            q, y = p.split('_')
            return int(y) * 10 + int(q.replace('Q', ''))
        except:
            return 0

    period_strs = [p[0] for p in rows if p[0]]
    period_strs.sort(key=parse_period_for_sort)

    periods = []
    for p in period_strs:
        parts = p.split('_')
        if len(parts) == 2:
            quarter, year = parts[0], parts[1]
            label = f"{period_label_map.get(quarter, quarter)} {year}"
        else:
            label = p
        periods.append({'id': p, 'label': label})

    return jsonify({'success': True, 'data': periods}), 200


@manager_bp.route('/farms/<farm_id>/observation-summary', methods=['GET'])
@token_required
@role_required('manager')
def get_farm_observation_summary(current_user, farm_id):
    from app.db.models import GisLayer, EsgMetric
    import statistics

    project_id = current_user.project_id
    farm = Farm.query.filter_by(id=farm_id, project_id=project_id).first()
    if not farm:
        return jsonify({'success': False, 'message': 'Lahan tidak ditemukan'}), 404

    latest_period = db.session.query(GisLayer.period)\
        .filter_by(farm_id=farm_id)\
        .order_by(GisLayer.period.desc())\
        .first()
    period = latest_period[0] if latest_period else None

    result = {
        'productivity': None,
        'soc_carbon': None,
        'agb_biomass': None,
        'plant_health': None,
        'soil_nutrition': None,
    }

    if not period:
        return jsonify({'success': True, 'data': result}), 200

    def get_layer_mean(layer_type):
        rows = GisLayer.query.filter_by(
            farm_id=farm_id, parameter_type=layer_type, period=period
        ).all()
        vals = [float(r.numerical_value) for r in rows if r.numerical_value is not None]
        if vals:
            return round(statistics.mean(vals), 4)
        return None

    ndvi_mean = get_layer_mean('ndvi')
    soc_mean = get_layer_mean('soc')
    biomass_mean = get_layer_mean('biomass')
    npk_mean = get_layer_mean('soilnpk')
    yield_mean = get_layer_mean('yield')
    
    n_mean = get_layer_mean('nitrogen')
    p_mean = get_layer_mean('phosphorus')
    k_mean = get_layer_mean('potassium')

    area = float(farm.total_area_ha) if farm.total_area_ha else 0

    if soc_mean is not None and area > 0:
        result['soc_carbon'] = round(soc_mean * area, 1)

    if biomass_mean is not None and area > 0:
        result['agb_biomass'] = round(biomass_mean * area, 1)

    if ndvi_mean is not None:
        health_pct = round(min(ndvi_mean * 100, 100), 0)
        result['plant_health'] = int(health_pct)

    if npk_mean is not None:
        npk_pct = round(min(npk_mean, 100), 0)
        result['soil_nutrition'] = int(npk_pct)

    if yield_mean is not None:
        result['productivity'] = round(yield_mean, 2)
        
    # Ekologi (N, P, K)
    result['n_value'] = round(n_mean, 1) if n_mean is not None else '-'
    result['p_value'] = round(p_mean, 1) if p_mean is not None else '-'
    result['k_value'] = round(k_mean, 1) if k_mean is not None else '-'
    
    # Sosial (Demographics)
    farm_farmers = farm.farmers
    total_farmers = len(farm_farmers)
    result['petani_terberdayakan'] = total_farmers if total_farmers > 0 else '-'
    
    if total_farmers > 0:
        male_count = 0
        female_count = 0
        for f in farm_farmers:
            g = str(getattr(f, 'gender', '') or '').lower()
            if g.startswith('l') or g.startswith('m'):
                male_count += 1
            elif g.startswith('p') or g.startswith('f') or g.startswith('w'):
                female_count += 1
        result['sebaran_gender'] = f"{male_count}L / {female_count}P"
        
        ages = [f.age for f in farm_farmers if getattr(f, 'age', None) is not None]
        if ages:
            muda = sum(1 for a in ages if a < 30)
            dewasa = sum(1 for a in ages if 30 <= a <= 50)
            tua = sum(1 for a in ages if a > 50)
            
            parts = []
            if muda > 0: parts.append(f"<30: {muda}")
            if dewasa > 0: parts.append(f"30-50: {dewasa}")
            if tua > 0: parts.append(f">50: {tua}")
            
            result['sebaran_usia'] = " | ".join(parts) if parts else '-'
        else:
            result['sebaran_usia'] = '-'
    else:
        result['sebaran_gender'] = '-'
        result['sebaran_usia'] = '-'

    # Ekonomi
    from app.db.models import FinancialRecord
    fin_records = FinancialRecord.query.filter_by(farm_id=farm.id).order_by(FinancialRecord.created_at.desc()).limit(2).all()
    
    if len(fin_records) >= 2:
        curr = fin_records[0]
        prev = fin_records[1]
        
        rev_curr = curr.estimated_revenue or 0
        rev_prev = prev.estimated_revenue or 0
        if rev_prev > 0:
            pct_inc = ((rev_curr - rev_prev) / rev_prev) * 100
            pct_inc_rounded = round(pct_inc, 1)
            if abs(pct_inc_rounded) < 0.05:
                pct_inc_rounded = 0.0
            result['peningkatan_pendapatan'] = f"{'+' if pct_inc_rounded >= 0 else ''}{pct_inc_rounded}"
        else:
            result['peningkatan_pendapatan'] = '-'
            
        cost_curr = curr.operational_cost or 0
        cost_prev = prev.operational_cost or 0
        if cost_prev > 0:
            cost_sav = ((cost_prev - cost_curr) / cost_prev) * 100
            cost_sav_rounded = round(cost_sav, 1)
            if abs(cost_sav_rounded) < 0.05:
                cost_sav_rounded = 0.0
            result['penghematan_biaya'] = f"{'+' if cost_sav_rounded >= 0 else ''}{cost_sav_rounded}"
        else:
            result['penghematan_biaya'] = '-'
    else:
        result['peningkatan_pendapatan'] = '-'
        result['penghematan_biaya'] = '-'

    if result['soc_carbon'] is not None and isinstance(result['soc_carbon'], (int, float)):
        carbon_revenue = result['soc_carbon'] * 150000
        result['estimasi_pendapatan_carbon'] = f"{carbon_revenue:,.0f}".replace(',', '.')
    else:
        result['estimasi_pendapatan_carbon'] = '-'

    return jsonify({'success': True, 'data': result}), 200


@manager_bp.route('/reports/<report_id>/download', methods=['GET'])
@token_required
@role_required('manager')
def download_report(current_user, report_id):
    from app.db.models import DocumentReport, GisLayer, FinancialRecord, Farmer, SensorData, EsgMetric
    report = DocumentReport.query.filter_by(id=report_id).first()
    if not report:
        return jsonify({'success': False, 'message': 'Laporan tidak ditemukan'}), 404

    report_types = [t.strip() for t in report.report_type.split(',')] if report.report_type else []
    is_comprehensive = 'comprehensive' in report_types

    TYPE_LABELS_EN = {
        'comprehensive': 'Comprehensive Operational Report',
        'agronomy': 'Soil Health & Nutrients Report',
        'carbon': 'Carbon Balance & MRV Report',
        'finance': 'Productivity & Financial Performance Report',
        'traceability': 'Traceability & Supply Integrity Report',
        'social': 'Farmer Partners & Social Empowerment Report'
    }

    if len(report_types) == 1 and report_types[0] in TYPE_LABELS_EN:
        header_title = TYPE_LABELS_EN[report_types[0]]
        footer_label = TYPE_LABELS_EN[report_types[0]]
        report_type_label = TYPE_LABELS_EN[report_types[0]]
    elif is_comprehensive:
        header_title = 'Comprehensive Operational Report'
        footer_label = 'Comprehensive Operational Report'
        report_type_label = 'Comprehensive Operational Report'
    else:
        label_list = [TYPE_LABELS_EN.get(t, t.replace('_', ' ').title()) for t in report_types]
        header_title = 'Operational Report' if len(label_list) > 2 else ' & '.join(label_list)
        footer_label = header_title
        report_type_label = ', '.join(label_list) if label_list else 'Operational Report'

    # 2. Ambil Data Lahan
    total_area = 0
    commodity = '-'
    altitude = '-'
    agroforestry = '-'
    farm_obj = None
    selected_farms = []
    default_proj_loc = current_user.project.location if current_user.project and current_user.project.location else '-'
    
    if report.farm_id:
        farms_matched = Farm.query.filter_by(id=report.farm_id).all()
    elif report.farm_name and report.farm_name != 'Semua Lahan':
        names = [n.strip() for n in report.farm_name.split(',') if n.strip()]
        farms_matched = Farm.query.filter(Farm.project_id == current_user.project_id, Farm.name.in_(names)).all()
        if not farms_matched:
            farms_matched = Farm.query.filter_by(project_id=current_user.project_id).all()
    else:
        farms_matched = Farm.query.filter_by(project_id=current_user.project_id).all()

    if farms_matched:
        farm_obj = farms_matched[0]
        total_area = sum(float(f.total_area_ha or 0) for f in farms_matched)
        commodities = list(set([f.crop_variety for f in farms_matched if f.crop_variety]))
        commodity = ', '.join(commodities) if commodities else '-'
        altitudes = list(set([f.altitude for f in farms_matched if f.altitude]))
        altitude = ', '.join(altitudes) if altitudes else '-'
        agroforestry = farms_matched[0].agroforestry_system or '-'
        for f in farms_matched:
            selected_farms.append({
                'name': f.name,
                'location': f.location or default_proj_loc,
                'commodity': f.crop_variety or '-',
                'altitude': f.altitude or '-',
                'area_ha': float(f.total_area_ha or 0)
            })

    target_farm_ids = [f.id for f in farms_matched] if farms_matched else []

    # 3. Helper Query GIS
    def get_avg_gis_layer(param_type):
        if not target_farm_ids:
            return 0.0
        query = db.session.query(db.func.avg(GisLayer.numerical_value))\
            .filter(GisLayer.farm_id.in_(target_farm_ids), GisLayer.parameter_type == param_type)
        val = query.scalar()
        return round(float(val), 2) if val else 0.0

    # 4. Data Agronomi (NDVI, NPK, Sensor Lingkungan)
    raw_ndvi = get_avg_gis_layer('ndvi')
    plant_health = round(raw_ndvi * 100) if raw_ndvi > 0 else 0
    if plant_health >= 75:
        health_status = 'Optimal'
        health_badge_class = 'badge-success'
    elif plant_health >= 60:
        health_status = 'Cukup / Waspada'
        health_badge_class = 'badge-warning'
    else:
        health_status = 'Kritis'
        health_badge_class = 'badge-danger'

    n_val = get_avg_gis_layer('nitrogen')
    p_val = get_avg_gis_layer('phosphorus')
    k_val = get_avg_gis_layer('potassium')

    # Sensor Data
    sensor_q = SensorData.query
    if target_farm_ids:
        sensor_q = sensor_q.filter(SensorData.farm_id.in_(target_farm_ids))
    sensor = sensor_q.order_by(SensorData.created_at.desc()).first()
    soil_ph = round(float(sensor.ph), 2) if sensor and sensor.ph else '-'
    soil_temp = round(float(sensor.temperature), 2) if sensor and sensor.temperature else '-'
    soil_humidity = round(float(sensor.humidity), 2) if sensor and sensor.humidity else '-'
    soil_ec = round(float(sensor.ec), 2) if sensor and sensor.ec else '-'

    # 5. Data Karbon Riil GIS (SOC, Biomassa, Valuasi Pasar)
    soc_avg = get_avg_gis_layer('soc')
    total_soc_ton = soc_avg * total_area
    biomass_avg = get_avg_gis_layer('biomass')
    total_biomass_ton = biomass_avg * total_area
    total_carbon_credit = total_soc_ton + total_biomass_ton
    estimated_carbon_value = total_carbon_credit * 150000 
    formatted_carbon_value = f"{estimated_carbon_value:,.0f}".replace(',', '.')
    
    total_credit_avg = round(soc_avg + biomass_avg, 2)
    val_per_ha = f"{(estimated_carbon_value / total_area if total_area > 0 else 0):,.0f}".replace(',', '.')

    # 6. Data Finansial & Panen
    fin_query = db.session.query(
        db.func.sum(FinancialRecord.total_production_kg),
        db.func.sum(FinancialRecord.estimated_revenue),
        db.func.sum(FinancialRecord.operational_cost)
    )
    if target_farm_ids:
        fin_query = fin_query.filter(FinancialRecord.farm_id.in_(target_farm_ids))
    else:
        farm_ids = [f.id for f in Farm.query.filter_by(project_id=current_user.project_id).all()]
        fin_query = fin_query.filter(FinancialRecord.farm_id.in_(farm_ids))
    
    fin_stats = fin_query.first()
    total_yield = float(fin_stats[0] or 0)
    gross_revenue = float(fin_stats[1] or 0)
    operational_cost = float(fin_stats[2] or 0)
    net_profit = gross_revenue - operational_cost
    profit_margin = round((net_profit / gross_revenue * 100), 1) if gross_revenue > 0 else 0
    productivity_per_ha = round(total_yield / total_area, 1) if total_area > 0 else 0

    def format_rupiah(val):
        return f"{val:,.0f}".replace(',', '.')

    # 7. Data Sosial & Petani
    if len(target_farm_ids) == 1 and farm_obj:
        farmers_list = farm_obj.farmers
    else:
        farmers_list = Farmer.query.filter_by(company_id=current_user.project.company_id).all()

    total_farmers = len(farmers_list)
    male_count = sum(1 for f in farmers_list if str(f.gender).lower().startswith(('l', 'm', 'pria')))
    female_count = sum(1 for f in farmers_list if str(f.gender).lower().startswith(('p', 'f', 'wanita')))
    valid_ages = [f.age for f in farmers_list if f.age]
    avg_age = round(sum(valid_ages) / len(valid_ages)) if valid_ages else 0

    farmers_detail = []
    for f in farmers_list:
        farmers_detail.append({
            'name': f.name,
            'gender': f.gender or '-',
            'age': f.age or '-',
            'join_year': f.join_year or '-'
        })

    # 8. Data Batch Rantai Pasok (Traceability)
    from app.db.models import Batch
    batches_q = Batch.query
    if target_farm_ids:
        batches_q = batches_q.filter(Batch.farm_id.in_(target_farm_ids))
    else:
        batches_q = batches_q.filter_by(company_id=current_user.project.company_id)
    batches_list = []
    for b in batches_q.all():
        batches_list.append({
            'batch_number': b.batch_number,
            'product_name': b.product_name,
            'harvest_date': b.harvest_date.strftime('%d-%m-%Y') if b.harvest_date else '-',
            'status': b.status.replace('_', ' ').capitalize()
        })

    has_boundary = any(f.boundary is not None for f in farms_matched) if farms_matched else False
    boundary_status = 'Tersedia Polygon GIS (SRID 4326)' if has_boundary else 'Belum Dipetakan'

    # 9. Zona Waktu Indonesia Barat (WIB = UTC+7)
    from datetime import timezone, timedelta
    wib_tz = timezone(timedelta(hours=7))
    generated_at_wib = datetime.now(wib_tz).strftime("%d %b %Y, %H:%M WIB")

    # 10. Convert Logo to Base64
    logo_base64 = None
    possible_paths = [
        os.path.join(current_app.root_path, 'static', 'images', 'logo_name.png'),
        '/home/thomas/agrivision magang/agrivision/backend/app/static/images/logo_name.png',
        '/home/thomas/agrivision magang/agrivision/frontend/public/assets/images/logo_name.png'
    ]
    for p in possible_paths:
        if os.path.exists(p):
            try:
                with open(p, 'rb') as f:
                    logo_base64 = f"data:image/png;base64,{base64.b64encode(f.read()).decode('utf-8')}"
                break
            except Exception:
                pass

    # 11. Rakit Data Laporan Murni Database
    report_data = {
        'title': report.title,
        'header_title': header_title,
        'report_type_label': report_type_label,
        'footer_label': footer_label,
        'period': report.period or 'Bulan Berjalan',
        'generated_at': generated_at_wib,
        'farm_name': report.farm_name,
        'commodity': commodity,
        'altitude': altitude,
        'agroforestry': agroforestry,
        'total_area_ha': total_area,
        'selected_farms': selected_farms,
        'logo_base64': logo_base64,
        
        # Modul Flags
        'show_agronomy': is_comprehensive or 'agronomy' in report_types,
        'show_carbon': is_comprehensive or 'carbon' in report_types,
        'show_finance': is_comprehensive or 'finance' in report_types,
        'show_social': is_comprehensive or 'social' in report_types,
        'show_traceability': is_comprehensive or 'traceability' in report_types,
        
        # Detail Data Murni Tanpa Rekayasa
        'agronomy': {
            'plant_health': plant_health,
            'health_status': health_status,
            'n_val': n_val if n_val > 0 else '-', 
            'p_val': p_val if p_val > 0 else '-', 
            'k_val': k_val if k_val > 0 else '-',
            'soil_ph': soil_ph,
            'soil_temp': soil_temp,
            'soil_humidity': soil_humidity,
            'soil_ec': soil_ec
        },
        'carbon': {
            'soc': round(total_soc_ton, 1),
            'soc_avg': round(soc_avg, 2),
            'biomass': round(total_biomass_ton, 1),
            'biomass_avg': round(biomass_avg, 2),
            'total_credit': round(total_carbon_credit, 1),
            'total_credit_avg': total_credit_avg,
            'val_per_ha': val_per_ha,
            'estimated_value': formatted_carbon_value
        },
        'finance': {
            'total_yield': f"{total_yield:,.0f}".replace(',', '.'), 
            'productivity': productivity_per_ha,
            'gross_revenue': format_rupiah(gross_revenue), 
            'operational_cost': format_rupiah(operational_cost), 
            'net_profit': format_rupiah(net_profit),
            'profit_margin': profit_margin
        },
        'social': {
            'total_farmers': total_farmers, 
            'male_count': male_count, 
            'female_count': female_count,
            'avg_age': avg_age,
            'farmers_list': farmers_detail
        },
        'traceability': {
            'commodity': commodity,
            'altitude': altitude,
            'agroforestry': agroforestry,
            'total_area': total_area,
            'boundary_status': boundary_status,
            'batches': batches_list
        },
        'raw_data': [
            {'Parameter': 'Kesehatan Tanaman (%)', 'Nilai': plant_health},
            {'Parameter': 'Status Kesehatan', 'Nilai': health_status},
            {'Parameter': 'Total Hasil Panen (Kg)', 'Nilai': total_yield},
            {'Parameter': 'Produktivitas (Kg/Ha)', 'Nilai': productivity_per_ha},
            {'Parameter': 'Pendapatan Kotor (Rp)', 'Nilai': gross_revenue},
            {'Parameter': 'Biaya Operasional (Rp)', 'Nilai': operational_cost},
            {'Parameter': 'Laba Bersih (Rp)', 'Nilai': net_profit},
            {'Parameter': 'Margin Keuntungan (%)', 'Nilai': profit_margin},
            {'Parameter': 'Serapan SOC (ton CO2e)', 'Nilai': round(total_soc_ton, 1)},
            {'Parameter': 'Biomassa Karbon (ton CO2e)', 'Nilai': round(total_biomass_ton, 1)},
            {'Parameter': 'Estimasi Nilai Karbon (Rp)', 'Nilai': estimated_carbon_value},
            {'Parameter': 'Total Petani Terbina', 'Nilai': total_farmers},
            {'Parameter': 'Petani Laki-laki', 'Nilai': male_count},
            {'Parameter': 'Petani Perempuan', 'Nilai': female_count},
            {'Parameter': 'Rata-rata Usia Petani', 'Nilai': avg_age},
        ]
    }

    if report.format == 'pdf':
        buffer = ReportService.generated_pdf_report(report_data)
        mimetype = 'application/pdf'
        clean_title = (report.title or 'Laporan').replace(' ', '_')
        filename = f"{clean_title}.pdf"
    else:
        buffer = ReportService.generated_excel_raw_data(report_data)
        mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        clean_title = (report.title or 'Laporan').replace(' ', '_')
        filename = f"{clean_title}.xlsx"

    return send_file(
        buffer,
        as_attachment=True,
        download_name=filename,
        mimetype=mimetype
    )
