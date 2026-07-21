from app import create_app
from app.db.database import db
from app.db import models

app = create_app()

def setup_database():
    with app.app_context():
        print("Memulai inisialisasi database")
        db.create_all()
        print("Selesai")

if __name__ == "__main__":
    setup_database()


