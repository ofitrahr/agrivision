from app import create_app
from app.db.database import db
from app.db.models import User, Company, Project, ProjectPermission, Sdg
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


def seed_sdgs():
    with app.app_context():
        if Sdg.query.count() > 0:
            print("Katalog SDG sudah ada di database! Melewati proses seed.")
            return

        for num, title, goal in SDG_CATALOG:
            db.session.add(Sdg(code=str(num), title=title, goal=goal))
        db.session.commit()
        print(f"Berhasil menanam {len(SDG_CATALOG)} data SDG ke database.")


def seed_super_admin():
    with app.app_context():
        print("Memeriksa data Super Admin...")

        if User.query.filter_by(username="superadmin").first():
            print("Super Admin sudah ada di database! Melewati proses seed.")
            return

        # 1. Buat Company
        company = Company.query.filter_by(name="Agrivision Master").first()
        if not company:
            company = Company(
                name="Agrivision Master",
                description="Induk Sistem",
            )
            db.session.add(company)
            db.session.commit()

        # 2. Buat Project Default untuk Company
        project = Project.query.filter_by(name="Default Project").first()
        if not project:
            project = Project(
                name="Default Project",
                description="Proyek Utama",
                company_id=company.id,
            )
            db.session.add(project)
            db.session.commit()

        # 2.1 Buat ProjectPermission
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

        # 3. Buat User Super Admin dan hubungkan ke Project
        hashed = bcrypt.hashpw(
            "password123".encode("utf-8"),
            bcrypt.gensalt(),
        ).decode("utf-8")

        admin = User(
            project_id=project.id,
            username="superadmin",
            password_hash=hashed,
            full_name="Super Administrator",
            role="super_admin",
        )

        db.session.add(admin)
        db.session.commit()

        print("Berhasil! Akun login: 'superadmin' | Password: 'password123'")

        # 4. Buat sampel ActivityLog awal
        from app.db.models import ActivityLog
        from datetime import datetime, timedelta, timezone
        if ActivityLog.query.count() == 0:
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            logs = [
                ActivityLog(user_id=admin.id, action='CREATE', entity_type='Company', details='Perusahaan utama Agrivision Master didaftarkan', created_at=now - timedelta(hours=5)),
                ActivityLog(user_id=admin.id, action='CREATE', entity_type='Project', details='Proyek Utama berhasil dikonfigurasi', created_at=now - timedelta(hours=3)),
                ActivityLog(user_id=admin.id, action='UPDATE', entity_type='Permission', details='Pengaturan izin modul geospasial & agronomi diperbarui', created_at=now - timedelta(hours=1)),
                ActivityLog(user_id=admin.id, action='LOGIN', entity_type='User', details='User superadmin berhasil login ke sistem', created_at=now - timedelta(minutes=15)),
            ]
            db.session.add_all(logs)
            db.session.commit()
            print("Berhasil menanam sampel data Log Aktivitas awal.")


if __name__ == "__main__":
    seed_sdgs()
    seed_super_admin()