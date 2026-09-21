import os
import json
from datetime import date, datetime, timedelta, timezone
from app import create_app
from app.db.database import db
from app.db.models import (
    User, Company, Project, ProjectPermission, Sdg, SdgMaster,
    Farm, FarmCrop, Farmer, HarvestRecord, FinancialRecord,
    ActivityLog, RecentActivity, ProjectTraceability, ProjectTraceabilityProfile, ProjectSdg,
)
from geoalchemy2.elements import WKTElement
import bcrypt

app = create_app()

SDG_CATALOG = [
    (1, "No Poverty", "Menghapus kemiskinan dalam segala bentuknya di mana-mana"),
    (2, "Zero Hunger", "Menghapus kelaparan, mencapai ketahanan pangan dan gizi yang lebih baik, dan mendukung pertanian berkelanjutan"),
    (3, "Good Health and Well-being", "Memastikan kehidupan yang sehat dan mendukung kesejahteraan bagi semua orang di segala usia"),
    (4, "Quality Education", "Memastikan pendidikan yang inklusif dan bermutu serta mendukung kesempatan belajar sepanjang hayat"),
    (5, "Gender Equality", "Mencapai kesetaraan gender dan memberdayakan semua perempuan dan anak perempuan"),
    (6, "Clean Water and Sanitation", "Memastikan ketersediaan dan pengelolaan air bersih serta sanitasi yang berkelanjutan untuk semua"),
    (7, "Affordable and Clean Energy", "Memastikan akses terhadap energi yang terjangkau, andal, berkelanjutan, dan modern untuk semua"),
    (8, "Decent Work and Economic Growth", "Mendukung pertumbuhan ekonomi yang inklusif dan berkelanjutan, pekerjaan yang layak bagi semua"),
    (9, "Industry, Innovation and Infrastructure", "Membangun infrastruktur yang tangguh, mendukung industrialisasi inklusif, dan mendorong inovasi"),
    (10, "Reduced Inequalities", "Mengurangi ketimpangan di dalam dan antar negara"),
    (11, "Sustainable Cities and Communities", "Membangun kota dan pemukiman yang inklusif, aman, tangguh, dan berkelanjutan"),
    (12, "Responsible Consumption and Production", "Memastikan pola konsumsi dan produksi yang berkelanjutan"),
    (13, "Climate Action", "Mengambil tindakan segera untuk memerangi perubahan iklim dan dampaknya"),
    (14, "Life Below Water", "Melestarikan dan memanfaatkan samudera, laut, dan sumber daya kelautan secara berkelanjutan"),
    (15, "Life on Land", "Melindungi, memulihkan, dan mendukung pemanfaatan ekosistem daratan secara berkelanjutan"),
    (16, "Peace, Justice and Strong Institutions", "Mendukung masyarakat yang damai dan inklusif serta institusi yang kuat"),
    (17, "Partnerships for the Goals", "Memperkuat sarana pelaksanaan dan menghidupkan kembali kemitraan global untuk pembangunan berkelanjutan"),
]

# GeoJSON 5 blok lahan Kadatuan disalin ke dalam repo (backend/seed_data/kadatuan_aoi/) supaya
# seed.py tidak bergantung pada path host di luar repo (mis. saat dijalankan di dalam Docker
# container via `docker exec agrivision_backend python3 seed.py`).
GEOJSON_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'seed_data', 'kadatuan_aoi')

# Luas (Ha) dipakai literal sesuai data lapangan; boundary spasial dibaca dari file GeoJSON.
KADATUAN_BLOCKS = [
    {"file": "AOI_KADATUAN_1.geojson", "name": "Blok 1 - Kadatuan (Pak Erus)", "area_ha": 0.25, "pj": "Pak Erus", "is_main": False},
    {"file": "AOI_KADATUAN_2.geojson", "name": "Blok 2 - Kadatuan (Pak Ido)", "area_ha": 0.78, "pj": "Pak Ido", "is_main": False},
    {"file": "AOI_KADATUAN_3.geojson", "name": "Blok 3 - Kadatuan (Pak Pena)", "area_ha": 4.47, "pj": "Pak Pena", "is_main": True},
    {"file": "AOI_KADATUAN_4.geojson", "name": "Blok 4 - Kadatuan (Pak Pena)", "area_ha": 0.50, "pj": "Pak Pena", "is_main": False},
    {"file": "AOI_KADATUAN_5.geojson", "name": "Blok 5 - Kadatuan (Pak Pena)", "area_ha": 0.48, "pj": "Pak Pena", "is_main": False},
]

AGROFORESTRY_SYSTEM = "Agroforestri Terintegrasi (Kopi, Naungan Buah & Hortikultura)"
CROP_VARIETY_LABEL = "Kopi Arabika, Jeruk Bali, Alpukat, Cabe, Terong"

KADATUAN_CROP_ALLOCATION = {
    "AOI_KADATUAN_1.geojson": [("Kopi Arabika", 0.15), ("Alpukat", 0.04), ("Jeruk Bali", 0.03), ("Cabe", 0.02), ("Terong", 0.01)],
    "AOI_KADATUAN_2.geojson": [("Kopi Arabika", 0.47), ("Alpukat", 0.12), ("Jeruk Bali", 0.08), ("Cabe", 0.06), ("Terong", 0.05)],
    "AOI_KADATUAN_3.geojson": [("Kopi Arabika", 2.68), ("Alpukat", 0.67), ("Jeruk Bali", 0.45), ("Cabe", 0.35), ("Terong", 0.32)],
    "AOI_KADATUAN_4.geojson": [("Kopi Arabika", 0.30), ("Alpukat", 0.08), ("Jeruk Bali", 0.05), ("Cabe", 0.04), ("Terong", 0.03)],
    "AOI_KADATUAN_5.geojson": [("Kopi Arabika", 0.29), ("Alpukat", 0.07), ("Jeruk Bali", 0.05), ("Cabe", 0.04), ("Terong", 0.03)],
}

# Rekap panen ceri kopi bulanan (Rekap_Data_Periodik_2025-2026.xlsx), total 7.153 kg.
# Data agregat kebun (sumbernya tidak dipecah per blok) - dicatat di Blok 3 (Lahan Utama).
KADATUAN_HARVEST_DATA = [
    ("2025-10", 104), ("2025-11", 279), ("2025-12", 208),
    ("2026-01", 970), ("2026-02", 1380), ("2026-03", 2046),
    ("2026-04", 858), ("2026-05", 479), ("2026-06", 557), ("2026-07", 272),
]
PRICE_PER_KG_CHERRY = 12000  # estimasi pendapatan Rp/kg ceri
OPERATIONAL_COST_RATIO = 0.45  # estimasi biaya operasional proporsional thd pendapatan


def get_password_hash(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def seed_sdgs():
    with app.app_context():
        if Sdg.query.count() > 0:
            print("Katalog SDG sudah ada di database! Melewati proses seed.")
            return

        for num, title, goal in SDG_CATALOG:
            db.session.add(Sdg(
                code=str(num),
                title=title,
                goal=goal,
                image_url=f"/static/uploads/sdg-logos/{num}.png",
            ))
        db.session.commit()
        print(f"Berhasil menanam {len(SDG_CATALOG)} data SDG ke database.")


def seed_super_admin():
    if User.query.filter_by(username="superadmin").first():
        print("Superadmin already seeded.")
        return
    company = Company(name="Agrivision Master", description="Induk Sistem")
    db.session.add(company)
    db.session.commit()

    project = Project(name="Default Project", description="Proyek Utama", company_id=company.id)
    db.session.add(project)
    db.session.commit()

    perm = ProjectPermission(
        project_id=project.id,
        module_gis=True,
        module_traceability=True,
        module_agronomy=True,
        module_board_reports=True,
        can_access_ndvi=True,
        can_access_soc=True,
        can_access_yield=True,
        can_access_biomass=True,
        can_access_soilnpk=True
    )
    db.session.add(perm)
    db.session.commit()

    admin = User(
        project_id=project.id,
        username="superadmin",
        password_hash=get_password_hash("password123"),
        full_name="Super Administrator",
        role="super_admin"
    )
    db.session.add(admin)
    db.session.commit()
    print("Superadmin seeded.")


def clear_old_data():
    # farm_crops ikut terhapus otomatis (FarmCrop.farm_id ondelete='CASCADE' di models.py)
    old_company_names = ["AgriCorp Indonesia", "PT Kadatuan Koffie Nusantara"]
    deleted = Company.query.filter(Company.name.in_(old_company_names)).delete(synchronize_session=False)
    db.session.commit()
    if deleted:
        print(f"Menghapus {deleted} data company lama ({', '.join(old_company_names)}) beserta seluruh data terkait (cascade).")
    else:
        print("Tidak ada data company lama yang perlu dihapus.")


def geojson_polygon_to_wkt(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if data.get('type') == 'FeatureCollection':
        feature = data['features'][0]
    elif data.get('type') == 'Feature':
        feature = data
    else:
        raise ValueError(f"{filepath}: tipe GeoJSON '{data.get('type')}' tidak didukung.")

    geometry = feature['geometry']
    if geometry['type'] != 'Polygon':
        raise ValueError(f"{filepath}: hanya geometry Polygon yang didukung, dapat '{geometry['type']}'.")

    ring_wkt_list = []
    for ring in geometry['coordinates']:
        points_wkt = ", ".join(f"{lon} {lat}" for lon, lat in ring)
        ring_wkt_list.append(f"({points_wkt})")

    return f"POLYGON({', '.join(ring_wkt_list)})"


def seed_kadatuan_data():
    clear_old_data()
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # 1. Company & Project
    company = Company(
        name="PT Kadatuan Koffie Nusantara",
        description="Perkebunan kopi arabika spesialti agroforestri di dataran tinggi Garut, Jawa Barat.",
        address="Kadatuan, Garut, Jawa Barat",
        subscription_plan="Enterprise",
        max_farms=20,
        max_users=20,
        branding_color="#116a3a",
    )
    db.session.add(company)
    db.session.commit()

    project = Project(
        company_id=company.id,
        name="Perkebunan Kopi Arabika Kadatuan",
        description="Perkebunan kopi arabika Typica & Lini S, agroforestri di bawah naungan pohon pinus, Kadatuan, Garut.",
        commodity="Kopi Arabika Typica & Lini S",
        location="Garut, Jawa Barat",
    )
    db.session.add(project)
    db.session.commit()

    db.session.add(ProjectPermission(
        project_id=project.id,
        module_gis=True,
        module_traceability=True,
        module_agronomy=True,
        module_board_reports=True,
        can_access_ndvi=True,
        can_access_soc=True,
        can_access_yield=True,
        can_access_biomass=True,
        can_access_soilnpk=True,
    ))
    db.session.commit()

    # 2. Akun Pengguna
    manager = User(
        project_id=project.id,
        username="manager_kadatuan",
        password_hash=get_password_hash("password123"),
        full_name="Manager Kebun Kadatuan",
        role="manager",
    )
    board = User(
        project_id=project.id,
        username="board_kadatuan",
        password_hash=get_password_hash("password123"),
        full_name="Board Kadatuan Koffie",
        role="board",
    )
    db.session.add_all([manager, board])
    db.session.commit()

    # 3. Petani Penanggung Jawab (PJ) per blok
    # Catatan: birth_year/join_year tidak ada di sumber data - diisi estimasi wajar
    # (Pak Pena paling senior karena bertanggung jawab atas 3 blok termasuk lahan utama).
    farmer_defs = {
        "Pak Erus": {"birth_year": 1979, "join_year": 2022},
        "Pak Ido": {"birth_year": 1986, "join_year": 2022},
        "Pak Pena": {"birth_year": 1972, "join_year": 2020},
    }
    farmers_by_name = {}
    for name, meta in farmer_defs.items():
        farmer = Farmer(
            company_id=company.id,
            name=name,
            gender="Laki-laki",
            birth_year=meta["birth_year"],
            join_year=meta["join_year"],
            address="Kadatuan, Garut, Jawa Barat",
            farm_info="Petani penanggung jawab (PJ) blok kebun kopi Kadatuan",
        )
        db.session.add(farmer)
        farmers_by_name[name] = farmer
    db.session.commit()

    # 4. Blok Lahan dari GeoJSON + penugasan petani via relasi farm_farmers
    farms_by_block = {}
    main_farm = None
    for block in KADATUAN_BLOCKS:
        geojson_path = os.path.join(GEOJSON_DIR, block["file"])
        wkt_geom = geojson_polygon_to_wkt(geojson_path)

        farm = Farm(
            project_id=project.id,
            name=block["name"],
            location="Kadatuan, Garut, Jawa Barat",
            crop_variety=CROP_VARIETY_LABEL,
            total_area_ha=block["area_ha"],
            altitude="1.100 - 1.300 mdpl",
            agroforestry_system=AGROFORESTRY_SYSTEM,
            boundary=WKTElement(wkt_geom, srid=4326),
            created_by=manager.id,
            status="active",
        )
        db.session.add(farm)
        db.session.commit()

        farm.farmers.append(farmers_by_name[block["pj"]])
        for crop_type, area_ha in KADATUAN_CROP_ALLOCATION[block["file"]]:
            db.session.add(FarmCrop(farm_id=farm.id, crop_type=crop_type, area_ha=area_ha))
        db.session.commit()

        farms_by_block[block["file"]] = farm
        if block["is_main"]:
            main_farm = farm

    print(f"{len(farms_by_block)} blok lahan Kadatuan berhasil ditanam dari GeoJSON ({GEOJSON_DIR}).")

    # 5. Rekap Panen & Finansial Bulanan (dicatat di Blok 3 - Lahan Utama, lihat catatan di atas)
    for period, kg in KADATUAN_HARVEST_DATA:
        revenue = kg * PRICE_PER_KG_CHERRY
        cost = round(revenue * OPERATIONAL_COST_RATIO, 2)

        db.session.add(HarvestRecord(
            company_id=company.id,
            farm_id=main_farm.id,
            period=period,
            yield_kg=kg,
            area_harvested_ha=main_farm.total_area_ha,
            notes="Panen ceri kopi arabika - direkap dari catatan periodik lapangan.",
        ))
        db.session.add(FinancialRecord(
            company_id=company.id,
            farm_id=main_farm.id,
            period=period,
            total_production_kg=kg,
            operational_cost=cost,
            estimated_revenue=revenue,
            notes=f"Estimasi Rp {PRICE_PER_KG_CHERRY:,}/kg ceri; biaya operasional estimasi {int(OPERATIONAL_COST_RATIO * 100)}% dari pendapatan.".replace(',', '.'),
        ))
    db.session.commit()

    total_kg = sum(kg for _, kg in KADATUAN_HARVEST_DATA)
    print(f"{len(KADATUAN_HARVEST_DATA)} periode data panen & finansial (Okt 2025 - Jul 2026, total {total_kg:,} kg) berhasil ditanam.".replace(',', '.'))

    # 6. Traceability Narrative
    origin_story = (
        "Kopi Arabika Kadatuan ditanam secara agroforestri di bawah naungan pohon pinus "
        "dataran tinggi Jawa Barat."
    )
    profile = ProjectTraceabilityProfile(
        project_id=project.id,
        title="Kopi Arabika Kadatuan",
        tagline="Ditanam di bawah naungan pinus, dataran tinggi Garut",
        origin_story=origin_story,
        description=origin_story,
        social_narrative="Memberdayakan 3 petani penanggung jawab blok kebun (Pak Erus, Pak Ido, Pak Pena) di Kadatuan, Garut.",
        economic_narrative=f"Estimasi pendapatan ceri Rp {PRICE_PER_KG_CHERRY:,}/kg, tercatat rutin bulanan sejak Oktober 2025.".replace(',', '.'),
        environmental_narrative="Sistem agroforestri di bawah naungan pohon pinus menjaga tutupan lahan dan keragaman hayati kebun.",
        status="published",
    )
    db.session.add(profile)
    db.session.commit()

    db.session.add(ProjectTraceability(
        project_id=project.id,
        origin_story=origin_story,
        social_description="Memberdayakan 3 petani penanggung jawab blok kebun di Kadatuan, Garut.",
        economic_description=f"Estimasi pendapatan ceri Rp {PRICE_PER_KG_CHERRY:,}/kg, tercatat rutin bulanan sejak Oktober 2025.".replace(',', '.'),
        environmental_description="Agroforestri di bawah naungan pohon pinus menjaga tutupan lahan dan keragaman hayati.",
        is_published=True,
    ))
    db.session.commit()

    # 7. Activity Log & Recent Activity (ringan, untuk dashboard admin/publik)
    db.session.add_all([
        ActivityLog(user_id=manager.id, action='CREATE', entity_type='Company', details='Perusahaan PT Kadatuan Koffie Nusantara berhasil diinisialisasi', created_at=now - timedelta(days=5)),
        ActivityLog(user_id=manager.id, action='CREATE', entity_type='Project', details='Proyek Perkebunan Kopi Arabika Kadatuan dibuat', created_at=now - timedelta(days=5)),
        ActivityLog(user_id=manager.id, action='UPDATE_FARM', entity_type='Farm', details=f'{len(farms_by_block)} blok lahan kebun Kadatuan didaftarkan dari data GeoJSON', created_at=now - timedelta(days=4)),
    ])
    db.session.add(RecentActivity(
        title="Kebun Kadatuan Bergabung dengan AgriVision",
        description="Perkebunan Kopi Arabika Kadatuan (Garut) mulai memantau 5 blok lahan melalui platform AgriVision.",
        activity_date=date(2025, 10, 1),
        display_order=1,
    ))
    db.session.commit()

    print("Seed data PT Kadatuan Koffie Nusantara berhasil digenerate!")
    return project


def link_project_sdgs(project, goal_numbers=(1, 2, 8, 12, 13, 15)):
    profile = ProjectTraceabilityProfile.query.filter_by(project_id=project.id).first()
    if not profile:
        print("[SDG] Project traceability profile tidak ditemukan, lewati link SDG.")
        return

    masters = SdgMaster.query.filter(SdgMaster.goal_number.in_(goal_numbers)).all()
    if not masters:
        print("[SDG] SdgMaster belum tersedia (pastikan seed_sdg_contribution sudah dijalankan). Lewati link SDG.")
        return

    already_linked = {ps.sdg_id for ps in ProjectSdg.query.filter_by(project_traceability_id=profile.id).all()}
    added = 0
    for master in masters:
        if master.id in already_linked:
            continue
        db.session.add(ProjectSdg(project_traceability_id=profile.id, sdg_id=master.id))
        added += 1
    db.session.commit()

    linked_goals = ', '.join(str(m.goal_number) for m in sorted(masters, key=lambda m: m.goal_number))
    print(f"[SDG] {added} SDG baru dihubungkan (goal: {linked_goals}) ke project '{project.name}'.")


def upload_sdg_logos_to_minio():
    use_minio = os.getenv('USE_MINIO', 'false').lower() == 'true'
    if not use_minio:
        print("[SDG Logos] USE_MINIO=false. Logo tetap menggunakan path lokal.")
        return

    try:
        import boto3
        from botocore.client import Config
    except ImportError:
        print("[SDG Logos] boto3 tidak terinstall. Logo tetap menggunakan path lokal.")
        return

    endpoint = os.getenv('MINIO_INTERNAL_ENDPOINT') or os.getenv('MINIO_ENDPOINT', 'http://localhost:9000')
    access_key = os.getenv('MINIO_ACCESS_KEY', 'admin_utama')
    secret_key = os.getenv('MINIO_SECRET_KEY', 'password_sangat_kuat_32karakter')
    bucket_name = os.getenv('MINIO_BUCKET_NAME', 'agrivision-uploads')
    subfolder = 'sdg-logos'
    logo_dir = os.path.join(os.path.dirname(__file__), 'static', 'uploads', 'sdg-logos')

    client = boto3.client(
        's3',
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(signature_version='s3v4', connect_timeout=5, read_timeout=10),
        region_name='us-east-1',
    )

    # Pastikan bucket ada
    try:
        client.head_bucket(Bucket=bucket_name)
    except Exception:
        client.create_bucket(Bucket=bucket_name)
        policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": "*",
                "Action": ["s3:GetObject"],
                "Resource": [f"arn:aws:s3:::{bucket_name}/*"],
            }],
        }
        client.put_bucket_policy(Bucket=bucket_name, Policy=json.dumps(policy))

    with app.app_context():
        success = 0
        for goal_number in range(1, 18):
            filename = f"{goal_number}.png"
            filepath = os.path.join(logo_dir, filename)

            if not os.path.isfile(filepath):
                print(f"  [SKIP] SDG {goal_number:02d}: file tidak ditemukan ({filepath})")
                continue

            object_name = f"{subfolder}/{filename}"
            public_url = f"{endpoint}/{bucket_name}/{object_name}"

            # Cek apakah sudah ada URL MinIO
            master = SdgMaster.query.filter_by(goal_number=goal_number).first()
            if master and master.image_url and 'localhost:9000' in str(master.image_url):
                print(f"  [SKIP] SDG {goal_number:02d}: sudah ada di MinIO")
                continue

            with open(filepath, 'rb') as f:
                client.upload_fileobj(f, bucket_name, object_name, ExtraArgs={'ContentType': 'image/png'})

            SdgMaster.query.filter_by(goal_number=goal_number).update({"image_url": public_url})
            Sdg.query.filter_by(code=str(goal_number)).update({"image_url": public_url})
            print(f"  [OK] SDG {goal_number:02d}: {public_url}")
            success += 1

        db.session.commit()
        print(f"[SDG Logos] {success} logo berhasil di-upload ke MinIO.")


if __name__ == "__main__":
    with app.app_context():
        seed_sdgs()
        seed_super_admin()

        # ==========================================
        # Seed data riil PT Kadatuan Koffie Nusantara
        # ==========================================
        kadatuan_project = seed_kadatuan_data()

        # ==========================================
        # Arsitektur traceability BARU (plan revisi terbaru).
        # Tanam SDG Master + Questionnaire kontribusi SDG (105 pertanyaan hardcoded).
        # ==========================================
        from seed_sdg_contribution import run as seed_sdg_contribution
        seed_sdg_contribution()

        # Hubungkan project Kadatuan ke SDG 1, 2, 8, 12, 13, 15 (butuh SdgMaster di atas).
        link_project_sdgs(kadatuan_project)

        # ==========================================
        # Upload SDG logos ke MinIO (jika USE_MINIO=true).
        # ==========================================
        upload_sdg_logos_to_minio()
