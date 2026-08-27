from flask import Blueprint, jsonify, request
from app.core.security import token_required, role_required
from app.services.admin_service import *
from app.services.gis_service import GISService
from app.db.models import User, Company, Farm, RecentActivity
from app.db.database import db


admin_bp = Blueprint('admin_bp', __name__)

@admin_bp.route('/dashboard/stats', methods=['GET'])
@token_required
@role_required('super_admin')
def dashboard_stats(current_user):
    result = get_dashboard_stats()
    return jsonify(result), 200


@admin_bp.route('/companies', methods=['GET'])
@token_required
@role_required('super_admin')
def get_companies(current_user):
    result = get_all_companies()
    return jsonify(result), 200


@admin_bp.route('/companies', methods=['POST'])
@token_required
@role_required('super_admin')
def add_company(current_user):
    data = request.get_json()

    if not data or not data.get('name'):
        return jsonify({"success": False, "message": "Nama company wajib diisi"}), 400
    
    result = create_company(data)
    if result.get('success'):
        from app.services.activity_service import log_activity
        log_activity(
            user_id=current_user.id,
            action='CREATE_COMPANY',
            entity_type='Company',
            details=f"Mendaftarkan perusahaan klien baru '{data.get('name')}'"
        )
    status_code = 201 if result.get('success') else 500
    return jsonify(result), status_code


@admin_bp.route('/companies/<company_id>', methods=['PUT'])
@token_required
@role_required('super_admin')
def edit_company(current_user, company_id):
    data = request.get_json()

    if not data:
        return jsonify({"success": False, "message": "Data body tidak boleh kosong"}), 400
    
    result = update_company(company_id, data)

    if result.get('success'):
        from app.services.activity_service import log_activity
        log_activity(
            user_id=current_user.id,
            action='UPDATE_COMPANY',
            entity_type='Company',
            details=f"Memperbarui informasi perusahaan '{data.get('name', 'klien')}'"
        )
        status_code = 200
    elif "ditemukan" in result.get('message'):
        status_code = 404
    else:
        status_code = 500
            
    return jsonify(result), status_code

@admin_bp.route('/companies/<company_id>', methods=['DELETE'])
@token_required
@role_required('super_admin')
def delete_company(current_user, company_id):
    try:
        company = Company.query.get(company_id)
        if not company:
            return jsonify({'success': False, 'message': 'Perusahaan tidak ditemukan'}), 404
            
        company_name = company.name
        db.session.delete(company)
        db.session.commit()

        from app.services.activity_service import log_activity
        log_activity(
            user_id=current_user.id,
            action='DELETE_COMPANY',
            entity_type='Company',
            details=f"Menghapus perusahaan '{company_name}'"
        )
        return jsonify({'success': True, 'message': 'Perusahaan berhasil dihapus'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# ==========================================
# SAAS / SUBSCRIPTION MODULE MANAGEMENT
# ==========================================

@admin_bp.route('/projects/<project_id>/permissions', methods=['GET', 'PUT'])
@token_required
@role_required('super_admin')
def manage_project_permissions(current_user, project_id):
    try:
        from app.db.models import ProjectPermission
        perms = ProjectPermission.query.filter_by(project_id=project_id).first()
        if not perms:
            perms = ProjectPermission(project_id=project_id)
            db.session.add(perms)
            db.session.commit()
            
        if request.method == 'GET':
            return jsonify({
                'success': True,
                'data': {
                    'id': perms.id,
                    'project_id': perms.project_id,
                    'module_gis': perms.module_gis,
                    'module_traceability': perms.module_traceability,
                    'module_agronomy': perms.module_agronomy,
                    'module_board_reports': perms.module_board_reports,
                    'can_access_ndvi': perms.can_access_ndvi,
                    'can_access_soc': perms.can_access_soc,
                    'can_access_yield': perms.can_access_yield,
                    'can_access_biomass': perms.can_access_biomass,
                    'can_access_soilnpk': perms.can_access_soilnpk
                }
            }), 200
            
        if request.method == 'PUT':
            data = request.json
            if 'module_gis' in data: perms.module_gis = data['module_gis']
            if 'module_traceability' in data: perms.module_traceability = data['module_traceability']
            if 'module_agronomy' in data: perms.module_agronomy = data['module_agronomy']
            if 'module_board_reports' in data: perms.module_board_reports = data['module_board_reports']
            if 'can_access_ndvi' in data: perms.can_access_ndvi = data['can_access_ndvi']
            if 'can_access_soc' in data: perms.can_access_soc = data['can_access_soc']
            if 'can_access_yield' in data: perms.can_access_yield = data['can_access_yield']
            if 'can_access_biomass' in data: perms.can_access_biomass = data['can_access_biomass']
            if 'can_access_soilnpk' in data: perms.can_access_soilnpk = data['can_access_soilnpk']
            
            db.session.commit()

            from app.services.activity_service import log_activity
            log_activity(
                user_id=current_user.id,
                action='UPDATE_PERMISSION',
                entity_type='ProjectPermission',
                details="Pengaturan izin modul & paket berlangganan diperbarui"
            )

            return jsonify({'success': True, 'message': 'Izin dan Modul berlangganan berhasil diperbarui'}), 200
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# ==========================================
# USER MANAGEMENT UNTUK PERUSAHAAN KLIEN
# ==========================================


@admin_bp.route('/companies/<company_id>/users', methods=['GET'])
@token_required
@role_required('super_admin')
def list_company_users(current_user, company_id):
    result = get_company_users(company_id)
    return jsonify(result), 200


@admin_bp.route('/companies/<company_id>/users', methods=['POST'])
@token_required
@role_required('super_admin')
def add_company_user(current_user, company_id):
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"success": False, "message": "Username dan password wajib diisi"}), 400

    result = create_company_user(company_id, data)
    if result.get('success'):
        from app.services.activity_service import log_activity
        log_activity(
            user_id=current_user.id,
            action='ADD_USER',
            entity_type='User',
            details=f"Menambahkan pengguna baru '{data.get('full_name', data.get('username'))}'"
        )
    return jsonify(result), 201 if result.get('success') else 400


@admin_bp.route('/users/<user_id>/reset-password', methods=['POST'])
@token_required
@role_required('super_admin')
def reset_password(current_user, user_id):
    data = request.get_json(silent=True) or {}
    
    result = reset_user_password(user_id, data)
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code


@admin_bp.route('/users/<user_id>', methods=['PUT'])
@token_required
@role_required('super_admin')
def edit_user(current_user, user_id):
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "Data body tidak boleh kosong"}), 400
        
    result = update_user(user_id, data)
    if result.get('success'):
        from app.services.activity_service import log_activity
        log_activity(
            user_id=current_user.id,
            action='UPDATE_USER',
            entity_type='User',
            details=f"Memperbarui informasi akun pengguna '{data.get('full_name', data.get('username', 'user'))}'"
        )
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code


@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@token_required
@role_required('super_admin')
def remove_user(current_user, user_id):
    result = delete_user(user_id)
    if result.get('success'):
        from app.services.activity_service import log_activity
        log_activity(
            user_id=current_user.id,
            action='DELETE_USER',
            entity_type='User',
            details="Menghapus akun pengguna dari sistem"
        )
    status_code = 200 if result.get('success') else 400
    return jsonify(result), status_code

@admin_bp.route('/gis/map', methods=['GET'])
@token_required
@role_required('super_admin')
def get_global_map(current_user):
    try:
        map_html = GISService.generate_global_map()
        return jsonify({
            'success': True,
            'data': {
                'html': map_html
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/farms', methods=['POST'])
@token_required
@role_required('super_admin')
def create_farm(current_user):
    data = request.json
    try:
        geometry = data.get('geometry')
        geom_type = geometry.get('type')
        if geom_type == 'Polygon':
            coords = geometry['coordinates'][0]
            wkt_coords = ", ".join([f"{c[0]} {c[1]}" for c in coords])
            wkt_geom = f"SRID=4326;POLYGON(({wkt_coords}))"
        elif geom_type == 'MultiPolygon':
            polys = []
            for poly in geometry['coordinates']:
                coords = poly[0]
                wkt_coords = ", ".join([f"{c[0]} {c[1]}" for c in coords])
                polys.append(f"(({wkt_coords}))")
            wkt_geom = f"SRID=4326;MULTIPOLYGON({','.join(polys)})"
        else:
            raise Exception("Tipe geometri tidak didukung. Harap gunakan Polygon atau MultiPolygon.")

        new_farm = Farm(
            project_id=data.get('project_id'),
            name=data.get('name'),
            crop_variety=data.get('crop_variety'),
            total_area_ha=data.get('total_area_ha') or 0,
            boundary=wkt_geom,
            created_by=current_user.id
        )
        
        db.session.add(new_farm)
        db.session.commit()

        from app.services.activity_service import log_activity
        log_activity(
            user_id=current_user.id,
            action='CREATE_FARM',
            entity_type='Farm',
            entity_id=new_farm.id,
            details=f"Menambahkan lokasi lahan baru '{new_farm.name}'"
        )
        
        return jsonify({'success': True, 'message': 'Lahan berhasil disimpan dan diassign!'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 400


@admin_bp.route('/companies/<company_id>/projects', methods=['GET'])
@token_required
@role_required('super_admin')
def get_project(current_user, company_id):
    result = get_company_projects(company_id)
    return jsonify(result), 200

@admin_bp.route('/companies/<company_id>/projects', methods=['POST'])
@token_required
@role_required('super_admin')
def add_project(current_user, company_id):
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({"success": False, "message": "Nama project wajib diisi"}), 400
            
    result = create_project(company_id, data)
    if result.get('success'):
        from app.services.activity_service import log_activity
        log_activity(
            user_id=current_user.id,
            action='CREATE_PROJECT',
            entity_type='Project',
            details=f"Menambahkan proyek baru '{data.get('name')}'"
        )
    status_code = 201 if result.get('success') else 400
    return jsonify(result), status_code

@admin_bp.route('/farms', methods=['GET'])
@token_required
@role_required('super_admin')
def admin_get_farms(current_user):
    from app.db.models import Project
    farms = Farm.query.order_by(Farm.created_at.desc()).all()
    data = []
    for f in farms:
        project = Project.query.get(f.project_id)
        project = Project.query.get(f.project_id)
        
        data.append({
            'id': f.id,
            'name': f.name,
            'project_name': project.name if project else '-',
            'company_name': project.company.name if project and project.company else '-',
            'total_area_ha': float(f.total_area_ha) if f.total_area_ha else 0,
            'crop_variety': f.crop_variety,
            'created_at': f.created_at.isoformat() if f.created_at else None
        })
    return jsonify({'success': True, 'data': data}), 200



# ==========================================
# TRACEABILITY - SDG ASSESSMENT (COMPANY LEVEL)
# ==========================================

@admin_bp.route('/companies/<company_id>/sdgs', methods=['GET'])
@token_required
@role_required('super_admin')
def api_get_company_sdg_assessment(current_user, company_id):
    result, status_code = get_company_sdg_assessment_data(company_id)
    return jsonify(result), status_code


@admin_bp.route('/companies/<company_id>/sdgs', methods=['PUT'])
@token_required
@role_required('super_admin')
def api_save_company_sdg_assessment(current_user, company_id):
    data = request.get_json(silent=True) or {}
    result, status_code = save_company_sdg_assessment(company_id, data)
    return jsonify(result), status_code


@admin_bp.route('/companies/<company_id>/sdgs/verification/evidence', methods=['POST'])
@token_required
@role_required('super_admin')
def api_upload_company_sdg_verification(current_user, company_id):
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'File tidak ditemukan pada request'}), 400

    result, status_code = upload_company_sdg_verification(company_id, request.files['file'], current_user)
    return jsonify(result), status_code


@admin_bp.route('/companies/<company_id>/sdgs/verification/evidence', methods=['DELETE'])
@token_required
@role_required('super_admin')
def api_remove_company_sdg_verification(current_user, company_id):
    result, status_code = delete_company_sdg_verification(company_id)
    return jsonify(result), status_code


@admin_bp.route('/traceability/<project_id>', methods=['GET'])
@token_required
@role_required('super_admin')
def api_get_project_traceability(current_user, project_id):
    result, status_code = get_project_traceability_data(project_id)
    return jsonify(result), status_code


@admin_bp.route('/traceability/<project_id>', methods=['PUT'])
@token_required
@role_required('super_admin')
def api_save_project_traceability(current_user, project_id):
    data = request.get_json(silent=True) or {}
    result, status_code = save_project_traceability(project_id, data)
    return jsonify(result), status_code


@admin_bp.route('/farms/<farm_id>/map', methods=['GET'])
@token_required
@role_required('super_admin')
def get_admin_farm_map(current_user, farm_id):
    farm = Farm.query.filter_by(id=farm_id).first()
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
        is_thumbnail = request.args.get('thumbnail') == 'true'
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


@admin_bp.route('/activities', methods=['GET'])
@token_required
@role_required('super_admin')
def get_admin_activities(current_user):
    try:
        from app.db.models import ActivityLog, User
        from app.services.activity_service import format_time_ago

        limit_val = request.args.get('limit', default=50, type=int)
        logs = ActivityLog.query.order_by(ActivityLog.created_at.desc()).limit(limit_val).all()

        data = []
        for log in logs:
            user = User.query.get(log.user_id) if log.user_id else None
            user_name = (user.full_name or user.username) if user else 'Sistem'

            icon = 'info'
            act = log.action.upper()
            if 'COMPANY' in act or 'CREATE' in act:
                icon = 'domain_add'
            elif 'USER' in act or 'FARMER' in act:
                icon = 'group_add'
            elif 'UPDATE' in act or 'FARM' in act:
                icon = 'edit_note'
            elif 'LOGIN' in act:
                icon = 'login'

            data.append({
                'id': str(log.id),
                'icon': icon,
                'text': log.details or f"{log.action} {log.entity_type}",
                'subtext': f"{user_name} • {format_time_ago(log.created_at)}",
                'created_at': log.created_at.isoformat()
            })

        return jsonify({'success': True, 'data': data}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ======================== RECENT ACTIVITIES ========================

@admin_bp.route('/recent-activities', methods=['GET'])
@token_required
@role_required('super_admin')
def get_recent_activities(current_user):
    try:
        activities = RecentActivity.query.order_by(RecentActivity.display_order.asc()).all()
        data = [{
            'id': str(a.id),
            'title': a.title,
            'description': a.description,
            'image_path': a.image_path,
            'activity_date': a.activity_date.isoformat() if a.activity_date else None,
            'display_order': a.display_order,
            'created_at': a.created_at.isoformat() if a.created_at else None,
            'updated_at': a.updated_at.isoformat() if a.updated_at else None
        } for a in activities]
        return jsonify({'success': True, 'data': data}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/recent-activities', methods=['POST'])
@token_required
@role_required('super_admin')
def create_recent_activity(current_user):
    try:
        title = request.form.get('title')
        description = request.form.get('description')
        activity_date = request.form.get('activity_date')

        if not title or not description or not activity_date:
            return jsonify({'success': False, 'message': 'Judul, deskripsi, dan tanggal wajib diisi'}), 400

        image_path = None
        if 'file' in request.files and request.files['file'].filename:
            from app.services.upload_service import save_file_locally
            try:
                image_path = save_file_locally(request.files['file'], subfolder='activities')
            except ValueError as e:
                return jsonify({'success': False, 'message': str(e)}), 400

        from datetime import date
        max_order = db.session.query(db.func.max(RecentActivity.display_order)).scalar() or 0

        activity = RecentActivity(
            title=title,
            description=description,
            image_path=image_path,
            activity_date=date.fromisoformat(activity_date),
            display_order=max_order + 1
        )
        db.session.add(activity)
        db.session.commit()

        from app.services.activity_service import log_activity
        log_activity(
            user_id=current_user.id,
            action='CREATE',
            entity_type='RecentActivity',
            entity_id=activity.id,
            details=f"Menambahkan aktivitas '{title}'"
        )

        return jsonify({
            'success': True,
            'message': 'Aktivitas berhasil ditambahkan',
            'data': {
                'id': str(activity.id),
                'title': activity.title,
                'description': activity.description,
                'image_path': activity.image_path,
                'activity_date': activity.activity_date.isoformat(),
                'display_order': activity.display_order
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/recent-activities/reorder', methods=['PUT'])
@token_required
@role_required('super_admin')
def reorder_recent_activities(current_user):
    try:
        data = request.get_json()
        order = data.get('order', [])

        if not order:
            return jsonify({'success': False, 'message': 'Data urutan tidak valid'}), 400

        for index, activity_id in enumerate(order):
            activity = RecentActivity.query.get(activity_id)
            if activity:
                activity.display_order = index

        db.session.commit()
        return jsonify({'success': True, 'message': 'Urutan berhasil diperbarui'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/recent-activities/<activity_id>', methods=['PUT'])
@token_required
@role_required('super_admin')
def update_recent_activity(current_user, activity_id):
    try:
        activity = RecentActivity.query.get(activity_id)
        if not activity:
            return jsonify({'success': False, 'message': 'Aktivitas tidak ditemukan'}), 404

        title = request.form.get('title')
        description = request.form.get('description')
        activity_date = request.form.get('activity_date')

        if title:
            activity.title = title
        if description:
            activity.description = description
        if activity_date:
            from datetime import date
            activity.activity_date = date.fromisoformat(activity_date)

        if 'file' in request.files and request.files['file'].filename:
            from app.services.upload_service import save_file_locally
            try:
                activity.image_path = save_file_locally(request.files['file'], subfolder='activities')
            except ValueError as e:
                return jsonify({'success': False, 'message': str(e)}), 400

        db.session.commit()

        from app.services.activity_service import log_activity
        log_activity(
            user_id=current_user.id,
            action='UPDATE',
            entity_type='RecentActivity',
            entity_id=activity.id,
            details=f"Memperbarui aktivitas '{activity.title}'"
        )

        return jsonify({
            'success': True,
            'message': 'Aktivitas berhasil diperbarui',
            'data': {
                'id': str(activity.id),
                'title': activity.title,
                'description': activity.description,
                'image_path': activity.image_path,
                'activity_date': activity.activity_date.isoformat(),
                'display_order': activity.display_order
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/recent-activities/<activity_id>', methods=['DELETE'])
@token_required
@role_required('super_admin')
def delete_recent_activity(current_user, activity_id):
    try:
        activity = RecentActivity.query.get(activity_id)
        if not activity:
            return jsonify({'success': False, 'message': 'Aktivitas tidak ditemukan'}), 404

        title = activity.title
        db.session.delete(activity)
        db.session.commit()

        from app.services.activity_service import log_activity
        log_activity(
            user_id=current_user.id,
            action='DELETE',
            entity_type='RecentActivity',
            details=f"Menghapus aktivitas '{title}'"
        )

        return jsonify({'success': True, 'message': 'Aktivitas berhasil dihapus'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@admin_bp.route('/gis/upload', methods=['POST'])
@token_required
@role_required('super_admin')
def upload_gis_data(current_user):
    from app.db.models import GisLayer, Farm
    import csv
    import json
    import random
    from io import StringIO
    
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'Tidak ada file yang diunggah'}), 400
        
    file = request.files['file']
    farm_id = request.form.get('farm_id')
    period = request.form.get('period')
    
    if file.filename == '':
        return jsonify({'success': False, 'message': 'Pilih file terlebih dahulu'}), 400
        
    if not farm_id or not period:
        return jsonify({'success': False, 'message': 'Farm ID dan Periode wajib diisi'}), 400
        
    farm = Farm.query.get(farm_id)
    if not farm:
        return jsonify({'success': False, 'message': 'Lahan tidak ditemukan'}), 404

    # Ambil boundary untuk safety bounds
    def parse_boundary_bbox(f):
        if not f.boundary: return None
        try:
            from geoalchemy2.functions import ST_XMin, ST_XMax, ST_YMin, ST_YMax
            xmin = db.session.scalar(ST_XMin(f.boundary))
            xmax = db.session.scalar(ST_XMax(f.boundary))
            ymin = db.session.scalar(ST_YMin(f.boundary))
            ymax = db.session.scalar(ST_YMax(f.boundary))
            if None in (xmin, xmax, ymin, ymax): return None
            return (float(ymin), float(ymax), float(xmin), float(xmax))
        except:
            return None
            
    bbox = parse_boundary_bbox(farm)
    if not bbox:
        return jsonify({'success': False, 'message': 'Lahan belum memiliki poligon koordinat yang valid'}), 400

    try:
        rows = []
        if file.filename.endswith('.csv'):
            stream = StringIO(file.stream.read().decode("UTF8"), newline=None)
            csv_reader = csv.DictReader(stream)
            rows = list(csv_reader)
        elif file.filename.endswith('.json'):
            rows = json.loads(file.stream.read().decode("UTF8"))
        else:
            return jsonify({'success': False, 'message': 'Hanya mendukung file .csv dan .json'}), 400

        # Helper
        def random_point(box):
            return random.uniform(box[0], box[1]), random.uniform(box[2], box[3])
            
        ANOMALY_THRESH = {'ndvi': 0.4, 'soc': 30.0, 'biomass': 80.0, 'yield': 1.2, 'soilnpk': 100.0}
        UNITS = {'ndvi': 'index', 'soc': 'Ton C/Ha', 'biomass': 'Kg C/Ha', 'yield': 'Ton/Ha', 'soilnpk': 'kg NPK/Ha'}

        # Hapus data yang ada untuk farm_id & period ini agar tidak duplikat
        GisLayer.query.filter_by(farm_id=farm_id, period=period).delete()
        db.session.commit()

        layers_to_add = []
        
        # Ambil max 500 titik per upload agar DB tidak over
        sampled_rows = random.sample(rows, min(500, len(rows))) if len(rows) > 500 else rows

        for row in sampled_rows:
            try:
                ndvi_val = float(row.get('NDVI', 0))
                oc_val   = float(row.get('OC', 0))
                lat, lon = random_point(bbox) # Sementara assign ke dalam bbox farm
                
                param_values = {
                    'ndvi':    ndvi_val,
                    'soc':     round(oc_val, 4),
                    'biomass': round(oc_val * 1.45, 2),
                    'yield':   round(max(0.3, ndvi_val * 3.8), 2),
                    'soilnpk': round(min(280, max(60, oc_val * 3.2)), 2),
                }

                for param, value in param_values.items():
                    layers_to_add.append(GisLayer(
                        farm_id=farm_id,
                        coordinate=f'SRID=4326;POINT({lon} {lat})',
                        parameter_type=param,
                        period=period,
                        numerical_value=value,
                        unit=UNITS[param],
                        is_anomaly=(value < ANOMALY_THRESH[param]),
                        source='Web Import (Sentinel-2)'
                    ))
            except Exception:
                continue
                
        db.session.bulk_save_objects(layers_to_add)
        db.session.commit()
        
        from app.services.activity_service import log_activity
        log_activity(
            user_id=current_user.id,
            action='UPLOAD_GIS_DATA',
            entity_type='GisLayer',
            details=f"Mengimpor {len(layers_to_add)} data layer ke Lahan ID {farm_id} untuk periode {period}"
        )
        
        return jsonify({'success': True, 'message': f'Berhasil memproses {len(sampled_rows)} titik data, menghasilkan {len(layers_to_add)} parameter gis_layers.'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Gagal memproses file: {str(e)}'}), 500

