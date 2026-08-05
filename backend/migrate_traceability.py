from sqlalchemy import text

from app import create_app
from app.db.database import db
from app.db import models

app = create_app()


def migrate():
    with app.app_context():
        # Skema lama traceability project-level (per-SDG) dihapus karena
        # SDG sekarang level company. Isi hanya data test, aman di-recreate.
        db.session.execute(text("DROP TABLE IF EXISTS project_sdg_evidences CASCADE;"))
        db.session.execute(text("DROP TABLE IF EXISTS project_sdgs CASCADE;"))
        db.session.execute(text("DROP TABLE IF EXISTS project_traceabilities CASCADE;"))
        db.session.execute(text("DROP TABLE IF EXISTS company_sdg_verifications CASCADE;"))
        db.session.execute(text("DROP TABLE IF EXISTS company_sdgs CASCADE;"))
        db.session.execute(text("DROP TABLE IF EXISTS sdgs CASCADE;"))
        db.session.commit()

        db.create_all()

        db.session.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS commodity VARCHAR(100);"))
        db.session.commit()

        print("Migrasi selesai: tabel traceability dibuat ulang sesuai skema company-level, kolom commodity ditambahkan.")


if __name__ == "__main__":
    migrate()
