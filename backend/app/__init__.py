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

    from app.api.routes.admin_routes import admin_bp
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    from app.api.routes.manager_routes import manager_bp
    app.register_blueprint(manager_bp, url_prefix='/api/manager')

    from app.api.routes.board_routes import board_bp
    app.register_blueprint(board_bp, url_prefix='/api/board')

    return app