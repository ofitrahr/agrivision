import time
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app import create_app
from app.db.database import db
from app.db import models

app = create_app()


def wait_for_db(max_retries=15, delay=2):
    with app.app_context():
        for i in range(max_retries):
            try:
                db.session.execute(text("SELECT 1;"))
                return True
            except OperationalError:
                print(f"Menunggu database siap... ({i+1}/{max_retries})")
                time.sleep(delay)
        raise Exception("Gagal terhubung ke database setelah beberapa kali percobaan.")


def setup_database():
    wait_for_db()
    with app.app_context():
        print("Mereset dan memulai inisialisasi database...")
        db.session.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        db.session.commit()

        db.session.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public;"))
        db.session.commit()
        db.session.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        db.session.commit()

        db.create_all()

        # VIEW agregasi Company SDG untuk arsitektur traceability baru (plan.md #8)
        db.session.execute(text("""
            CREATE OR REPLACE VIEW company_sdg_summary AS
            SELECT DISTINCT
                p.company_id AS company_id,
                sm.id AS sdg_id,
                sm.goal_number,
                sm.name AS sdg_name
            FROM projects p
            JOIN project_traceability_profiles ptp ON ptp.project_id = p.id
            JOIN project_sdgs_new ps ON ps.project_traceability_id = ptp.id
            JOIN sdg_masters sm ON sm.id = ps.sdg_id;
        """))
        db.session.commit()

        print("Selesai.")


if __name__ == "__main__":
    setup_database()