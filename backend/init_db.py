from sqlalchemy import text

from app import create_app
from app.db.database import db
from app.db import models

app = create_app()


def setup_database():
    with app.app_context():
        print("Mereset dan memulai inisialisasi database...")
        db.session.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        db.session.commit()

        db.session.execute(text("DROP SCHEMA public CASCADE; CREATE SCHEMA public;"))
        db.session.commit()
        db.session.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        db.session.commit()

        db.create_all()

        print("Selesai.")


if __name__ == "__main__":
    setup_database()