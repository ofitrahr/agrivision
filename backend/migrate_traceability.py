from sqlalchemy import text

from app import create_app
from app.db.database import db
from app.db import models  # noqa: F401

app = create_app()


def create_company_sdg_view():
    view_sql = text("""
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
    """)
    db.session.execute(view_sql)
    db.session.commit()


def migrate():
    with app.app_context():
        db.create_all()
        create_company_sdg_view()
        print("Migrasi selesai: tabel & view traceability baru dibuat (paralel dengan skema lama).")


if __name__ == "__main__":
    migrate()