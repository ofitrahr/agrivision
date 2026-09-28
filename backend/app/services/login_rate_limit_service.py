import logging
from datetime import datetime, timedelta

from app.db.database import db
from app.db.models import LoginAttempt, User
from flask import current_app

logger = logging.getLogger(__name__)


def _normalize(username):
    return str(username or '').strip().lower()[:100]


def get_login_retry_after(ip_address, username):
    cfg = current_app.config
    now = datetime.utcnow()

    ip_since = now - timedelta(seconds=cfg['LOGIN_IP_WINDOW_SECONDS'])
    ip_attempts = LoginAttempt.query.filter(
        LoginAttempt.ip_address == ip_address,
        LoginAttempt.created_at >= ip_since,
    ).order_by(LoginAttempt.created_at.asc()).all()
    if len(ip_attempts) >= cfg['LOGIN_MAX_ATTEMPTS_PER_IP']:
        oldest = ip_attempts[-cfg['LOGIN_MAX_ATTEMPTS_PER_IP']].created_at
        return max(1, int((oldest - ip_since).total_seconds()) + 1)

    user_since = now - timedelta(seconds=cfg['LOGIN_LOCKOUT_SECONDS'])
    user_attempts = LoginAttempt.query.filter(
        LoginAttempt.username == _normalize(username),
        LoginAttempt.created_at >= user_since,
    ).order_by(LoginAttempt.created_at.asc()).all()
    if len(user_attempts) >= cfg['LOGIN_MAX_ATTEMPTS_PER_USER']:
        oldest = user_attempts[-cfg['LOGIN_MAX_ATTEMPTS_PER_USER']].created_at
        return max(1, int((oldest - user_since).total_seconds()) + 1)

    return None


def record_failed_login(ip_address, username):
    cfg = current_app.config
    now = datetime.utcnow()
    normalized = _normalize(username)
    try:
        cutoff = now - timedelta(seconds=max(cfg['LOGIN_LOCKOUT_SECONDS'], cfg['LOGIN_IP_WINDOW_SECONDS']))
        LoginAttempt.query.filter(LoginAttempt.created_at < cutoff).delete(synchronize_session=False)
        db.session.add(LoginAttempt(ip_address=ip_address, username=normalized, created_at=now))
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error("Gagal mencatat percobaan login: %s", e)
        return

    user_failures = LoginAttempt.query.filter(
        LoginAttempt.username == normalized,
        LoginAttempt.created_at >= now - timedelta(seconds=cfg['LOGIN_LOCKOUT_SECONDS']),
    ).count()
    if user_failures == cfg['LOGIN_MAX_ATTEMPTS_PER_USER']:
        logger.warning("Akun '%s' dikunci sementara setelah %s percobaan login gagal (IP terakhir %s)",
                       normalized, user_failures, ip_address)
        user = User.query.filter(db.func.lower(User.username) == normalized).first()
        if user:
            from app.services.activity_service import log_activity
            log_activity(
                user_id=user.id,
                action='LOGIN_LOCKED',
                entity_type='User',
                entity_id=user.id,
                details=f"Akun {user.username} dikunci sementara karena {user_failures} percobaan login gagal",
                ip_address=ip_address,
            )


def clear_failed_logins(username):
    try:
        LoginAttempt.query.filter(LoginAttempt.username == _normalize(username)).delete(synchronize_session=False)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.error("Gagal menghapus catatan percobaan login: %s", e)
