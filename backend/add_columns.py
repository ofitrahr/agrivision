from app import create_app
from app.db.database import db
from sqlalchemy import text

app = create_app()
with app.app_context():
    try:
        db.session.execute(text("ALTER TABLE farmers ADD COLUMN gender VARCHAR(20)"))
        db.session.execute(text("ALTER TABLE farmers ADD COLUMN age INTEGER"))
        db.session.execute(text("ALTER TABLE farmers ADD COLUMN join_year INTEGER"))
        db.session.execute(text("ALTER TABLE farmers ADD COLUMN farm_info TEXT"))
        db.session.commit()
        print("Success adding columns!")
    except Exception as e:
        print("Error:", e)
