from datetime import datetime, timezone
from app.db.models import ActivityLog
from app import db

def log_activity(user_id, action, entity_type, details=None, entity_id=None, ip_address=None):
    try:
        log = ActivityLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            ip_address=ip_address
        )
        db.session.add(log)
        db.session.commit()
        return log
    except Exception as e:
        db.session.rollback()
        print(f"Error logging activity: {e}")
        return None

def format_time_ago(dt):
    if not dt:
        return 'Baru saja'
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    diff = now - dt
    seconds = diff.total_seconds()
    if seconds < 60:
        return 'Baru saja'
    elif seconds < 3600:
        minutes = int(seconds / 60)
        return f'{minutes} menit yang lalu'
    elif seconds < 86400:
        hours = int(seconds / 3600)
        return f'{hours} jam yang lalu'
    elif seconds < 172800:
        return 'Kemarin'
    else:
        days = int(seconds / 86400)
        return f'{days} hari yang lalu'
