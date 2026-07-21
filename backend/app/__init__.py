from flask import Flask
from app.core.config import Config
from app.db.database import db

def create_app():
    app = Flask(__name__)

    #Load Konfigurasi database
    app.config.from_object(Config)

    db.init_app(app)

    @app.route('/api/health')
    def health_check():
        return {"success": True, "message": "Backend and DB setup is running!"}

    return app