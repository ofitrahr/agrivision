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
    company_id = current_user.company_id
    
    farms_count = Farm.query.filter_by(company_id=company_id).count()
    farmers_count = Farmer.query.filter_by(company_id=company_id).count()
    
    return jsonify({
        'success': True,
        'data': {
            'total_farms': farms_count,
            'total_farmers': farmers_count
        }
    }), 200

@manager_bp.route('/profile', methods=['GET', 'PUT'])
@token_required
@role_required('manager')
def manager_profile(current_user):
    company = Company.query.get(current_user.company_id)
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
    company_id = current_user.company_id
    
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
            
        photo_url = None
        if 'photo' in request.files:
            file = request.files['photo']
            if file.filename != '':
                photo_url = save_file_locally(file, subfolder='farmers')
                
        new_farmer = Farmer(
            company_id=company_id,
            name=name,
            phone=phone,
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

@manager_bp.route('/farmers/<farmer_id>', methods=['DELETE'])
@token_required
@role_required('manager')
def delete_farmer(current_user, farmer_id):
    farmer = Farmer.query.filter_by(id=farmer_id, company_id=current_user.company_id).first()
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
    company_id = current_user.company_id
    farms = Farm.query.filter_by(company_id=company_id).all()
    data = []
    for f in farms:
        data.append({
            'id': f.id,
            'name': f.name,
            'crop_variety': f.crop_variety,
            'total_area_ha': float(f.total_area_ha) if f.total_area_ha else 0
        })
    return jsonify({'success': True, 'data': data}), 200

@manager_bp.route('/farms/<farm_id>/blocks', methods=['GET', 'POST'])
@token_required
@role_required('manager')
def manager_farm_blocks(current_user, farm_id):
    farm = Farm.query.filter_by(id=farm_id, company_id=current_user.company_id).first()
    if not farm:
        return jsonify({'success': False, 'message': 'Lahan tidak ditemukan'}), 404

    from app.db.models import FarmBlock

    if request.method == 'GET':
        blocks = FarmBlock.query.filter_by(farm_id=farm.id).all()
        data = []
        for b in blocks:
            data.append({
                'id': b.id,
                'name': b.name,
                'crop_type': b.crop_type,
                'area_ha': float(b.area_ha) if b.area_ha else 0,
                'farmer_id': b.farmer_id
            })
        return jsonify({'success': True, 'data': data}), 200

    # POST (Tambah blok lahan baru dari map Polygon draw)
    try:
        data = request.json
        name = data.get('name')
        crop_type = data.get('crop_type', '')
        area_ha = data.get('area_ha', 0)
        farmer_id = data.get('farmer_id')
        polygon_wkt = data.get('polygon_wkt') # WKT string
        
        if not name or not polygon_wkt:
            return jsonify({'success': False, 'message': 'Nama blok dan gambar polygon di peta wajib diisi'}), 400

        new_polygon_ewkt = f'SRID=4326;{polygon_wkt}'

        # Validasi Spasial
        if farm.boundary is not None:
            from geoalchemy2.functions import ST_Contains, ST_GeomFromEWKT
            is_inside = db.session.query(ST_Contains(farm.boundary, ST_GeomFromEWKT(new_polygon_ewkt))).scalar()
            
            if not is_inside:
                return jsonify({'success': False, 'message': 'Gagal menyimpan! Blok lahan harus digambar SEPENUHNYA di DALAM batas Lahan Utama (Garis Kuning).'}), 400

        new_block = FarmBlock(
            farm_id=farm.id,
            farmer_id=farmer_id if farmer_id else None,
            name=name,
            crop_type=crop_type,
            area_ha=area_ha,
            polygon=new_polygon_ewkt
        )
        db.session.add(new_block)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Blok lahan berhasil ditambahkan'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@manager_bp.route('/farms/<farm_id>/map', methods=['GET'])
@token_required
@role_required('manager')
def get_manager_farm_map(current_user, farm_id):
    farm = Farm.query.filter_by(id=farm_id, company_id=current_user.company_id).first()
    if not farm:
        return jsonify({'success': False, 'message': 'Lahan tidak ditemukan'}), 404

    from app.services.gis_service import GISService
    from app.db.models import FarmBlock
    from geoalchemy2.functions import ST_AsGeoJSON
    import json

    farm_geojson = None
    if farm.boundary is not None:
        geojson_str = db.session.scalar(ST_AsGeoJSON(farm.boundary))
        if geojson_str:
            farm_geojson = json.loads(geojson_str)

    blocks = FarmBlock.query.filter_by(farm_id=farm.id).all()
    existing_blocks_geojson = []
    for b in blocks:
        if b.polygon is not None:
            b_geojson_str = db.session.scalar(ST_AsGeoJSON(b.polygon))
            if b_geojson_str:
                existing_blocks_geojson.append({
                    'name': b.name,
                    'polygon': json.loads(b_geojson_str)
                })

    try:
        map_html = GISService.generate_manager_map(
            farm_boundary_geojson=farm_geojson,
            existing_blocks_geojson=existing_blocks_geojson
        )
        return jsonify({
            'success': True,
            'data': {
                'html': map_html
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@manager_bp.route('/farms/<farm_id>/agronomy-map', methods=['GET'])
@token_required
@role_required('manager')
def get_agronomy_farm_map(current_user, farm_id):
    from app.db.models import CompanyPermission
    
    # Cek izin akses agronomi modul
    perms = CompanyPermission.query.filter_by(company_id=current_user.company_id).first()
    if not perms or not perms.module_agronomy:
        return jsonify({'success': False, 'message': 'Perusahaan Anda tidak berlangganan Modul Agronomi'}), 403

    has_ndvi = perms.can_access_ndvi

    farm = Farm.query.filter_by(id=farm_id, company_id=current_user.company_id).first()
    if not farm:
        return jsonify({'success': False, 'message': 'Lahan tidak ditemukan'}), 404

    from app.services.gis_service import GISService
    from app.db.models import FarmBlock
    from geoalchemy2.functions import ST_AsGeoJSON
    import json

    farm_geojson = None
    if farm.boundary is not None:
        geojson_str = db.session.scalar(ST_AsGeoJSON(farm.boundary))
        if geojson_str:
            farm_geojson = json.loads(geojson_str)

    blocks = FarmBlock.query.filter_by(farm_id=farm.id).all()
    existing_blocks_geojson = []
    for b in blocks:
        if b.polygon is not None:
            b_geojson_str = db.session.scalar(ST_AsGeoJSON(b.polygon))
            if b_geojson_str:
                existing_blocks_geojson.append({
                    'name': b.name,
                    'crop': b.crop_type or 'Tanaman',
                    'polygon': json.loads(b_geojson_str)
                })

    try:
        map_html = GISService.generate_agronomy_map(
            farm_boundary_geojson=farm_geojson,
            existing_blocks_geojson=existing_blocks_geojson,
            has_ndvi=has_ndvi
        )
        return jsonify({
            'success': True,
            'data': {
                'html': map_html
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
