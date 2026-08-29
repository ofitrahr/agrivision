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

    # Tren jumlah lahan per periode tidak ada di DB, skip

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
        if 'crop_variety' in data:
            farm.crop_variety = data['crop_variety']
        if 'altitude' in data:
            farm.altitude = data['altitude']
        if 'agroforestry_system' in data and hasattr(farm, 'agroforestry_system'):
            setattr(farm, 'agroforestry_system', data['agroforestry_system'])
        
        farmer_ids = data.get('farmer_ids', [])
        
        # Parse crops (supports array of objects [{crop_type, area_ha}] or array of strings)
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

        report = DocumentReport(
            company_id=company_id,
            farm_id=farm_id if farm_id and farm_id != 'all' else None,
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
            result['peningkatan_pendapatan'] = f"{'+' if pct_inc >= 0 else ''}{round(pct_inc, 1)}"
        else:
            result['peningkatan_pendapatan'] = '-'
            
        cost_curr = curr.operational_cost or 0
        cost_prev = prev.operational_cost or 0
        if cost_prev > 0:
            cost_sav = ((cost_prev - cost_curr) / cost_prev) * 100
            result['penghematan_biaya'] = f"{'+' if cost_sav >= 0 else ''}{round(cost_sav, 1)}"
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
