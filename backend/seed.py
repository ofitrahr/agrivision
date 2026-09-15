import random
from datetime import date, datetime, timedelta, timezone
from app import create_app
from app.db.database import db
from app.db.models import (
    User, Company, Project, ProjectPermission, Sdg, CompanySdg, CompanySdgVerification,
    Farmer, TraceTemplate, TraceTemplateStep,
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

    print("Seed data bersih berhasil digenerate! (Tanpa data lahan, batas polygon, ataupun layer GIS)")

if __name__ == "__main__":
    with app.app_context():
        seed_sdgs()
        seed_super_admin()
        seed_comprehensive_data()
