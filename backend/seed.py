from app import create_app
from app.db.database import db
from app.db.models import User, Company, Project, ProjectPermission
import bcrypt

app = create_app()


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


if __name__ == "__main__":
    seed_super_admin()