from flask import Flask
from flask_cors import CORS
from app.core.config import Config
from app.db.database import db

def create_app():
    app = Flask(__name__)

    CORS(app)

    #Load Konfigurasi database  
    app.config.from_object(Config)
    db.init_app(app)

    @app.route('/api/health')
    def health_check():
        return {"success": True, "message": "Backend and DB setup is running!"}
    
    from app.api.routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    return app