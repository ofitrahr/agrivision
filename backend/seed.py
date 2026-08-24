import random
from datetime import date, datetime, timedelta, timezone
from app import create_app
from app.db.database import db
from app.db.models import (
    User, Company, Project, ProjectPermission, Sdg, CompanySdg, CompanySdgVerification,
    Farm, FarmCrop, Farmer, farm_farmers, GisLayer,
    TraceTemplate, TraceTemplateStep, Batch, BatchCheckpoint, QrCode,
    AgronomyActivity, HarvestRecord, FinancialRecord, EsgMetric,
    ActivityLog, RecentActivity, ProjectTraceability
)
import bcrypt

app = create_app()

SDG_CATALOG = [
    (1, "No Poverty", "Mengakhiri kemiskinan dalam segala bentuknya di mana pun."),
    (2, "Zero Hunger", "Mengakhiri kelaparan, mencapai ketahanan pangan dan gizi yang lebih baik, serta mendukung pertanian berkelanjutan."),
    (3, "Good Health and Well-being", "Memastikan kehidupan yang sehat dan mendukung kesejahteraan bagi semua orang di segala usia."),
    (4, "Quality Education", "Memastikan pendidikan yang inklusif dan bermutu serta mendukung kesempatan belajar sepanjang hayat."),
    (5, "Gender Equality", "Mencapai kesetaraan gender dan memberdayakan semua perempuan dan anak perempuan."),
    (6, "Clean Water and Sanitation", "Memastikan ketersediaan dan pengelolaan air bersih serta sanitasi yang berkelanjutan."),
    (7, "Affordable and Clean Energy", "Memastikan akses terhadap energi yang terjangkau, andal, berkelanjutan, dan modern."),
    (8, "Decent Work and Economic Growth", "Mendukung pertumbuhan ekonomi yang inklusif dan berkelanjutan serta pekerjaan layak bagi semua."),
    (9, "Industry, Innovation and Infrastructure", "Membangun infrastruktur yang tangguh, mendukung industrialisasi inklusif, dan mendorong inovasi."),
    (10, "Reduced Inequalities", "Mengurangi ketimpangan di dalam dan antar negara."),
    (11, "Sustainable Cities and Communities", "Membangun kota dan pemukiman yang inklusif, aman, tangguh, dan berkelanjutan."),
    (12, "Responsible Consumption and Production", "Mendukung pola konsumsi dan produksi yang bertanggung jawab."),
    (13, "Climate Action", "Mengambil tindakan segera untuk memerangi perubahan iklim dan dampaknya."),
    (14, "Life Below Water", "Melestarikan dan memanfaatkan samudera, laut, dan sumber daya kelautan secara berkelanjutan."),
    (15, "Life on Land", "Melindungi, memulihkan, dan mendukung pemanfaatan ekosistem daratan secara berkelanjutan."),
    (16, "Peace, Justice and Strong Institutions", "Mendukung masyarakat yang damai dan inklusif serta institusi yang kuat."),
    (17, "Partnerships for the Goals", "Memperkuat sarana pelaksanaan dan menghidupkan kembali kemitraan global untuk pembangunan berkelanjutan."),
]

def get_password_hash(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def seed_sdgs():
    if Sdg.query.count() > 0:
        print("SDGs already seeded.")
        return
    for num, title, goal in SDG_CATALOG:
        db.session.add(Sdg(code=str(num), title=title, goal=goal))
    db.session.commit()
    print("SDGs seeded.")

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
    
    perm = ProjectPermission(project_id=project.id, module_gis=True, module_traceability=True, module_agronomy=True, module_board_reports=True, can_access_ndvi=True, can_access_soc=True, can_access_yield=True, can_access_biomass=True, can_access_soilnpk=True)
    db.session.add(perm)
    db.session.commit()
    
    admin = User(project_id=project.id, username="superadmin", password_hash=get_password_hash("password123"), full_name="Super Administrator", role="super_admin")
    db.session.add(admin)
    db.session.commit()
    print("Superadmin seeded.")

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
        company_id=company.id, assessed_by="SGS Indonesia", evidence_file_url="https://example.com/cert.pdf",
        evidence_file_type="pdf", assessment_date=date(2024, 1, 15)
    ))
    db.session.commit()

    # 2. Company SDGs
    sdgs = Sdg.query.filter(Sdg.code.in_(["1", "2", "8", "12", "13", "15"])).all()
    for i, sdg in enumerate(sdgs):
        db.session.add(CompanySdg(company_id=company.id, sdg_id=sdg.id, description=f"Komitmen perusahaan untuk {sdg.title}", display_order=i))
    db.session.commit()

    # 3. Project
    project = Project(
        company_id=company.id, name="Kopi Mandailing Lestari", description="Proyek kopi berkelanjutan di daerah Mandailing Natal.",
        commodity="Kopi Arabika", location="Mandailing Natal, Sumatera Utara"
    )
    db.session.add(project)
    db.session.commit()

    db.session.add(ProjectPermission(
        project_id=project.id, module_gis=True, module_traceability=True, module_agronomy=True,
        module_board_reports=True, can_access_ndvi=True, can_access_soc=True, can_access_yield=True,
        can_access_biomass=True, can_access_soilnpk=True
    ))
    db.session.add(ProjectTraceability(
        project_id=project.id, hero_image_url="https://images.unsplash.com/photo-1497935586351-b67a49e012bf",
        origin_story="Berasal dari dataran tinggi Mandailing Natal, ditanam oleh petani lokal.",
        social_description="Memberdayakan 100+ petani lokal dengan upah yang adil.", economic_description="Meningkatkan pendapatan petani hingga 30% dari rata-rata.",
        environmental_description="Metode agroforestri untuk menjaga kelestarian hutan.", is_published=True
    ))
    db.session.commit()

    # 4. Users
    manager = User(project_id=project.id, username="manager_agri", password_hash=get_password_hash("password123"), full_name="Manager AgriCorp", role="manager")
    investor = User(project_id=project.id, username="investor_agri", password_hash=get_password_hash("password123"), full_name="Investor AgriCorp", role="board")
    db.session.add_all([manager, investor])
    db.session.commit()

    # 5. Farmers
    farmers = [
        Farmer(company_id=company.id, name="Budi Santoso", address="Desa A, Mandailing", phone="081234567890", gender="Male", birth_year=1980, join_year=2020),
        Farmer(company_id=company.id, name="Siti Aminah", address="Desa B, Mandailing", phone="081234567891", gender="Female", birth_year=1985, join_year=2021),
        Farmer(company_id=company.id, name="Ucok Harahap", address="Desa C, Mandailing", phone="081234567892", gender="Male", birth_year=1975, join_year=2019)
    ]
    db.session.add_all(farmers)
    db.session.commit()

    # 6. Farms
    # Koordinat di dataran tinggi perkebunan Mandailing Natal (Latitude positif, citra satelit hijau jelas)
    farm1 = Farm(project_id=project.id, name="Lahan Kopi A", crop_variety="Arabika Typica", total_area_ha=2.5, altitude="1200 mdpl", agroforestry_system="Shade-grown", created_by=manager.id, boundary="SRID=4326;POLYGON((99.6100 0.6860, 99.6115 0.6860, 99.6115 0.6875, 99.6100 0.6875, 99.6100 0.6860))")
    farm2 = Farm(project_id=project.id, name="Lahan Kopi B", crop_variety="Arabika Sigararutang", total_area_ha=1.8, altitude="1300 mdpl", agroforestry_system="Shade-grown", created_by=manager.id, boundary="SRID=4326;POLYGON((99.6130 0.6880, 99.6142 0.6880, 99.6142 0.6892, 99.6130 0.6892, 99.6130 0.6880))")
    db.session.add_all([farm1, farm2])
    db.session.commit()

    farm1.farmers.append(farmers[0])
    farm1.farmers.append(farmers[1])
    farm2.farmers.append(farmers[2])
    db.session.commit()
    
    # GisLayers
    for farm, center_pt in [(farm1, "POINT(99.61075 0.68675)"), (farm2, "POINT(99.6136 0.6886)")]:
        for param in ["NDVI", "SOC", "Biomass", "Yield", "SoilNPK"]:
            db.session.add(GisLayer(farm_id=farm.id, coordinate=f"SRID=4326;{center_pt}", parameter_type=param, period="Jun-24", numerical_value=random.uniform(0.1, 0.9) if param == "NDVI" else random.uniform(10, 100), unit="index" if param == "NDVI" else "units", is_anomaly=random.choice([True, False]), source="Sentinel-2"))
    db.session.commit()

    # 7. FarmCrops
    db.session.add(FarmCrop(farm_id=farm1.id, crop_type="Kopi", variety="Typica", planting_date=date(2018, 10, 1), area_ha=2.0))
    db.session.add(FarmCrop(farm_id=farm2.id, crop_type="Kopi", variety="Sigararutang", planting_date=date(2019, 11, 15), area_ha=1.5))
    db.session.commit()

    # 8. Financial Records & Harvest Records & ESG Metrics
    months = ["Jan-24", "Feb-24", "Mar-24", "Apr-24", "May-24", "Jun-24"]
    for month in months:
        for farm in [farm1, farm2]:
            yield_val = random.uniform(300, 500)
            area_ha = random.uniform(1.0, 2.5)
            db.session.add(HarvestRecord(company_id=company.id, farm_id=farm.id, period=month, yield_kg=yield_val, area_harvested_ha=area_ha))
            db.session.add(FinancialRecord(company_id=company.id, farm_id=farm.id, period=month, total_production_kg=yield_val, operational_cost=yield_val*15000, estimated_revenue=yield_val*80000))
            db.session.add(EsgMetric(company_id=company.id, farm_id=farm.id, period=month, carbon_footprint=random.uniform(50, 100), water_usage=random.uniform(200, 400), biodiversity_index=random.uniform(3, 5), social_compliance_score=random.uniform(4, 5)))
    db.session.commit()

    # 9. Agronomy Activities
    activities = ["Pemupukan Organik", "Pemangkasan", "Penyemprotan Hama Organik", "Pembersihan Gulma"]
    for farm in [farm1, farm2]:
        for i in range(5):
            db.session.add(AgronomyActivity(farm_id=farm.id, activity_type=random.choice(activities), quantity=random.uniform(10, 50), unit="Kg", notes="Kegiatan rutin", activity_date=date(2024, random.randint(1,6), random.randint(1,28)), created_by=manager.id))
    db.session.commit()

    # 10. Traceability Templates & Batches
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

    batch1 = Batch(company_id=company.id, farm_id=farm1.id, template_id=template.id, batch_number="BCH-2401", product_name="Arabika Typica Washed", harvest_date=date(2024, 5, 10), status="completed", completed_at=now - timedelta(days=5))
    batch2 = Batch(company_id=company.id, farm_id=farm2.id, template_id=template.id, batch_number="BCH-2402", product_name="Arabika Sigararutang Washed", harvest_date=date(2024, 6, 1), status="in_progress")
    db.session.add_all([batch1, batch2])
    db.session.commit()
    
    # Checkpoints & QR
    for step in steps:
        db.session.add(BatchCheckpoint(batch_id=batch1.id, step_id=step.id, status="completed", notes=f"Selesai tahap {step.name}", completed_at=now - timedelta(days=random.randint(1,4))))
    db.session.add(QrCode(batch_id=batch1.id, qr_image_url="https://example.com/qr/bch2401.png", public_url="https://agrivision.id/trace/BCH-2401"))
    db.session.commit()

    # 11. Activity Logs
    logs = [
        ActivityLog(user_id=manager.id, action='CREATE', entity_type='Batch', details='Batch BCH-2401 dimulai', created_at=now - timedelta(days=20)),
        ActivityLog(user_id=manager.id, action='UPDATE', entity_type='Batch', details='Batch BCH-2401 selesai', created_at=now - timedelta(days=5)),
        ActivityLog(user_id=manager.id, action='CREATE', entity_type='HarvestRecord', details='Catatan panen Juni 2024 ditambahkan', created_at=now - timedelta(days=2)),
        ActivityLog(user_id=investor.id, action='LOGIN', entity_type='User', details='Investor melihat laporan finansial', created_at=now - timedelta(hours=2))
    ]
    db.session.add_all(logs)
    db.session.commit()

    # 12. Recent Activities
    recent = [
        RecentActivity(title="Panen Raya 2024", description="Panen raya di Lahan Kopi A telah berhasil melebihi target.", activity_date=date(2024, 5, 15), display_order=1),
        RecentActivity(title="Sertifikasi Organik", description="AgriCorp mendapatkan pembaruan sertifikasi organik.", activity_date=date(2024, 6, 10), display_order=2)
    ]
    db.session.add_all(recent)
    db.session.commit()

    print("Comprehensive seed data for AgriCorp Indonesia successfully generated!")

if __name__ == "__main__":
    with app.app_context():
        seed_sdgs()
        seed_super_admin()
        seed_comprehensive_data()
