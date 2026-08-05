from sqlalchemy import text

from app import create_app
from app.db.database import db
from app.db import models

app = create_app()


def migrate():
    with app.app_context():
        # Tabel traceability masih baru (isi hanya data test), aman di-recreate.
        # Urutan: tabel yang mereferensikan tabel lain di-drop lebih dulu.
        db.session.execute(text("DROP TABLE IF EXISTS project_sdg_evidences CASCADE;"))
        db.session.execute(text("DROP TABLE IF EXISTS project_sdgs CASCADE;"))
        db.session.execute(text("DROP TABLE IF EXISTS project_traceabilities CASCADE;"))
        db.session.commit()

        db.create_all()

        db.session.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS commodity VARCHAR(100);"))
        db.session.commit()

        print("Migrasi selesai: project_traceabilities + project_sdgs + project_sdg_evidences dibuat ulang sesuai skema baru, kolom commodity ditambahkan.")


if __name__ == "__main__":
    migrate()
