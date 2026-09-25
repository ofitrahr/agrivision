import logging
import os
import sys

from flask import Flask
from flask_cors import CORS

from app.core.config import Config
from app.db.database import db


def _setup_logging():
    """Tanpa ini root logger tetap WARNING dan seluruh logger.info dibuang diam-diam."""
    level = getattr(logging, os.getenv('LOG_LEVEL', 'INFO').upper(), logging.INFO)
    root = logging.getLogger()
    root.setLevel(level)
    if not root.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)-7s %(name)s: %(message)s'))
        root.addHandler(handler)
    logging.getLogger('werkzeug').setLevel(logging.WARNING)


def create_app():
    _setup_logging()
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

    from app.api.routes.assessment_routes import assessment_bp
    app.register_blueprint(assessment_bp, url_prefix='/api/assessment')

    from app.api.routes.public_routes import public_bp
    app.register_blueprint(public_bp, url_prefix='/api/public')

    return app