import os

from dotenv import load_dotenv

load_dotenv()

    
class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:password@localhost:5432/agrivision"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-jwt-key")
    AUTH_COOKIE_NAME = os.getenv("AUTH_COOKIE_NAME", "access_token")
    AUTH_COOKIE_SECURE = os.getenv("AUTH_COOKIE_SECURE", "false").lower() == "true"
    AUTH_COOKIE_SAMESITE = os.getenv("AUTH_COOKIE_SAMESITE", "Lax")
    AUTH_COOKIE_MAX_AGE = int(os.getenv("AUTH_COOKIE_MAX_AGE", str(60 * 60 * 24)))
    CORS_ORIGINS = [
        o.strip() for o in os.getenv(
            "CORS_ORIGINS", "http://localhost,http://localhost:5173,http://127.0.0.1:5173"
        ).split(",") if o.strip()
    ]
    LOGIN_MAX_ATTEMPTS_PER_IP = int(os.getenv("LOGIN_MAX_ATTEMPTS_PER_IP", "5"))
    LOGIN_IP_WINDOW_SECONDS = int(os.getenv("LOGIN_IP_WINDOW_SECONDS", "60"))
    LOGIN_MAX_ATTEMPTS_PER_USER = int(os.getenv("LOGIN_MAX_ATTEMPTS_PER_USER", "10"))
    LOGIN_LOCKOUT_SECONDS = int(os.getenv("LOGIN_LOCKOUT_SECONDS", str(15 * 60)))
    TRUSTED_PROXY_COUNT = int(os.getenv("TRUSTED_PROXY_COUNT", "0"))
