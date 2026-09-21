import os
import json
import random
from datetime import date, datetime, timedelta, timezone
from app import create_app
from app.db.database import db
from app.db.models import (
    User, Company, Project, ProjectPermission, Sdg, SdgMaster, CompanySdg, CompanySdgVerification,
    Farm, FarmCrop, Farmer, farm_farmers, GisLayer,
    TraceTemplate, TraceTemplateStep, Batch, BatchCheckpoint, QrCode,
    AgronomyActivity, HarvestRecord, FinancialRecord, EsgMetric,
    ActivityLog, RecentActivity, ProjectTraceability, SensorData
)
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

def seed_kopi_test():
    with app.app_context():
        print("Memeriksa data Kopi Test...")

        company = Company.query.filter_by(name="Kopi Test").first()
        if not company:
            company = Company(
                name="Kopi Test",
                description="Perusahaan Kopi Test",
                subscription_plan="Pro",
                max_farms=10,
                max_users=10
            )
            db.session.add(company)
            db.session.commit()
            print("Company 'Kopi Test' berhasil dibuat.")

        project = Project.query.filter_by(name="Proyek Kopi Test", company_id=company.id).first()
        if not project:
            project = Project(
                name="Proyek Kopi Test",
                description="Proyek Lahan Kopi Test",
                commodity="Kopi",
                company_id=company.id
            )
            db.session.add(project)
            db.session.commit()
            print("Project 'Proyek Kopi Test' berhasil dibuat.")

        perm = ProjectPermission.query.filter_by(project_id=project.id).first()
        if not perm:
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

        hashed_password = bcrypt.hashpw(
            "password123".encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        manager = User.query.filter_by(username="manager_kopi").first()
        if not manager:
            manager = User(
                project_id=project.id,
                username="manager_kopi",
                password_hash=hashed_password,
                full_name="Manager Kopi Test",
                role="manager"
            )
            db.session.add(manager)
            print("Akun Manager 'manager_kopi' berhasil dibuat.")

        investor = User.query.filter_by(username="investor_kopi").first()
        if not investor:
            investor = User(
                project_id=project.id,
                username="investor_kopi",
                password_hash=hashed_password,
                full_name="Investor Kopi Test",
                role="board"
            )
            db.session.add(investor)
            print("Akun Investor 'investor_kopi' berhasil dibuat.")

        db.session.commit()

        farm = Farm.query.filter_by(name="Monumen Nasional", project_id=project.id).first()
        if not farm:
            wkt_geom = "SRID=4326;POLYGON((106.82605 -6.17635, 106.82665 -6.17635, 106.82665 -6.17575, 106.82605 -6.17575, 106.82605 -6.17635))"
            farm = Farm(
                project_id=project.id,
                name="Monumen Nasional",
                crop_variety="Kopi Arabika",
                total_area_ha=0.44,
                boundary=wkt_geom,
                created_by=manager.id if manager else None
            )
            db.session.add(farm)
            db.session.commit()
            print("Lahan 'Monumen Nasional' berhasil dibuat.")

def clear_comprehensive_data():
    Company.query.filter(Company.name == "AgriCorp Indonesia").delete()
    db.session.commit()
    print("Cleared previous comprehensive data for AgriCorp Indonesia.")

def seed_comprehensive_data():
    clear_comprehensive_data()
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    
    # 1. Company
    company = Company(
        name="AgriCorp Indonesia",
        description="Perusahaan Agrikultur Berkelanjutan",
        address="Jl. Sudirman No. 1, Jakarta",
        email="contact@agricorp.id",
        phone="021-12345678",
        subscription_plan="Enterprise",
        max_farms=100,
        max_users=50,
        branding_color="#1E40AF"
    )
    db.session.add(company)
    db.session.commit()
    
    db.session.add(CompanySdgVerification(
        company_id=company.id, 
        assessed_by="SGS Indonesia", 
        evidence_file_url="https://example.com/cert.pdf",
        evidence_file_type="pdf", 
        assessment_date=date(2024, 1, 15)
    ))
    db.session.commit()

    # 2. Company SDGs
    sdgs = Sdg.query.filter(Sdg.code.in_(["1", "2", "8", "12", "13", "15"])).all()
    for i, sdg in enumerate(sdgs):
        db.session.add(CompanySdg(
            company_id=company.id, 
            sdg_id=sdg.id, 
            description=f"Komitmen perusahaan untuk {sdg.title}", 
            display_order=i
        ))
    db.session.commit()

    # 3. Project
    project = Project(
        company_id=company.id, 
        name="Kopi Mandailing Lestari", 
        description="Proyek kopi berkelanjutan di daerah Mandailing Natal.",
        commodity="Kopi Arabika", 
        location="Mandailing Natal, Sumatera Utara"
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
        can_access_soilnpk=True
    ))
    db.session.add(ProjectTraceability(
        project_id=project.id, 
        hero_image_url="https://images.unsplash.com/photo-1497935586351-b67a49e012bf",
        origin_story="Berasal dari dataran tinggi Mandailing Natal, ditanam oleh petani lokal.",
        social_description="Memberdayakan 100+ petani lokal dengan upah yang adil.", 
        economic_description="Meningkatkan pendapatan petani hingga 30% dari rata-rata.",
        environmental_description="Metode agroforestri untuk menjaga kelestarian hutan.", 
        is_published=True
    ))
    db.session.commit()

    # 4. Users (Akun Manager & Investor Perusahaan)
    manager = User(
        project_id=project.id, 
        username="manager_agri", 
        password_hash=get_password_hash("password123"), 
        full_name="Manager AgriCorp", 
        role="manager"
    )
    investor = User(
        project_id=project.id, 
        username="investor_agri", 
        password_hash=get_password_hash("password123"), 
        full_name="Investor AgriCorp", 
        role="board"
    )
    db.session.add_all([manager, investor])
    db.session.commit()

    # 5. Farmers (Daftar Petani Terdaftar Siap Ditugaskan)
    farmers = [
        Farmer(company_id=company.id, name="Budi Santoso", address="Desa A, Mandailing", phone="081234567890", gender="Laki-laki", birth_year=1980, join_year=2020),
        Farmer(company_id=company.id, name="Siti Aminah", address="Desa B, Mandailing", phone="081234567891", gender="Perempuan", birth_year=1985, join_year=2021),
        Farmer(company_id=company.id, name="Ucok Harahap", address="Desa C, Mandailing", phone="081234567892", gender="Laki-laki", birth_year=1975, join_year=2019)
    ]
    db.session.add_all(farmers)
    db.session.commit()

    # 6. Traceability Template (Master Template Tanpa Batch Lahan)
    template = TraceTemplate(company_id=company.id, name="Kopi Wash Process", description="Standar proses cuci penuh.")
    db.session.add(template)
    db.session.commit()

    steps = [
        TraceTemplateStep(template_id=template.id, step_order=1, name="Panen Ceri", required_photo=True),
        TraceTemplateStep(template_id=template.id, step_order=2, name="Pulping & Fermentasi", required_notes=True),
        TraceTemplateStep(template_id=template.id, step_order=3, name="Pengeringan (Washing & Drying)", required_photo=True),
        TraceTemplateStep(template_id=template.id, step_order=4, name="Roasting & Pengemasan", required_photo=True)
    ]
    db.session.add_all(steps)
    db.session.commit()

    # 7. Activity Logs & Recent Activity
    logs = [
        ActivityLog(user_id=manager.id, action='CREATE', entity_type='Company', details='Perusahaan AgriCorp Indonesia berhasil diinisialisasi', created_at=now - timedelta(days=10)),
        ActivityLog(user_id=manager.id, action='CREATE', entity_type='Project', details='Proyek Kopi Mandailing Lestari dibuat', created_at=now - timedelta(days=9)),
        ActivityLog(user_id=investor.id, action='LOGIN', entity_type='User', details='Investor mengakses dashboard sistem', created_at=now - timedelta(hours=2))
    ]
    db.session.add_all(logs)

    recent = [
        RecentActivity(title="Sertifikasi Organik", description="AgriCorp memperbarui sertifikasi kemitraan organik.", activity_date=date(2026, 8, 20), display_order=1),
        RecentActivity(title="Pendaftaran Petani Mitra", description="3 Petani mitra lokal siap ditugaskan ke area perkebunan.", activity_date=date(2026, 8, 22), display_order=2)
    ]
    db.session.add_all(recent)
    db.session.commit()

    # 8. Seed Lahan Demo (~120 Ha) untuk GEE
    from geoalchemy2.elements import WKTElement
    coords = [
        [101.4000, 0.5000],
        [101.4100, 0.5000],
        [101.4100, 0.4900],
        [101.4000, 0.4900],
        [101.4000, 0.5000]
    ]
    wkt_coords = ", ".join([f"{c[0]} {c[1]}" for c in coords])
    wkt_geom = f"POLYGON(({wkt_coords}))"
    
    from sqlalchemy import text
    calc_area = db.session.scalar(
        text("SELECT ST_Area(ST_GeomFromText(:wkt, 4326)::geography) / 10000;"),
        {"wkt": wkt_geom}
    )
    
    new_farm = Farm(
        project_id=project.id,
        name="Kebun Sawit Riau (Demo 120 Ha)",
        location="Pekanbaru, Riau",
        crop_variety="Kelapa Sawit",
        total_area_ha=round(float(calc_area), 2) if calc_area else 123.0,
        boundary=WKTElement(wkt_geom, srid=4326),
        created_by=manager.id,
        status='active'
    )
    db.session.add(new_farm)
    db.session.commit()
    print(f"Seed lahan '{new_farm.name}' berhasil ditambahkan ke Project '{project.name}'.")

    print("Seed data bersih berhasil digenerate! (Termasuk 1 Lahan Demo untuk GEE)")

def upload_sdg_logos_to_minio():
    """Upload 17 SDG logo ke MinIO dan update image_url di database.

    Jalankan setelah seed_sdgs() dan seed_sdg_contribution().
    Idempotent: skip goal yang sudah punya URL MinIO.
    """
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
        # Seed data komprehensif (dev-v2)
        # ==========================================
        seed_comprehensive_data()

        # ==========================================
        # Arsitektur traceability BARU (plan revisi terbaru).
        # Tanam SDG Master + Questionnaire kontribusi SDG (105 pertanyaan hardcoded).
        # ==========================================
        from seed_sdg_contribution import run as seed_sdg_contribution
        seed_sdg_contribution()

        # ==========================================
        # Upload SDG logos ke MinIO (jika USE_MINIO=true).
        # ==========================================
        upload_sdg_logos_to_minio()
