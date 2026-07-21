from app import create_app
from app.db.database import db
from app.db.models import User, Company
import bcrypt

app = create_app()

def seed_super_admin():
    with app.app_context():
        print("Memeriksa data Super Admin...")
        
        if User.query.filter_by(username='superadmin').first():
            print("Super Admin sudah ada di database! Melewati proses seed.")
            return
            
        company = Company.query.filter_by(name='Agrivision Master').first()
        if not company:
            company = Company(name='Agrivision Master', description='Induk Sistem')
            db.session.add(company)
            db.session.commit() 

        hashed = bcrypt.hashpw('password123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        admin = User(
            company_id=company.id,
            username='superadmin',
            password_hash=hashed,
            full_name='Super Administrator',
            role='super_admin'
        )
        
        db.session.add(admin)
        db.session.commit()
        print("Berhasil! Akun login: 'superadmin' | Password: 'password123'")

if __name__ == "__main__":
    seed_super_admin()
