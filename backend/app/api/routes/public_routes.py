from flask import Blueprint, jsonify
from app.db.models import RecentActivity

public_bp = Blueprint('public_bp', __name__)


@public_bp.route('/recent-activities', methods=['GET'])
def get_public_recent_activities():
    try:
        activities = RecentActivity.query.order_by(RecentActivity.display_order.asc()).all()
        data = [{
            'id': str(a.id),
            'title': a.title,
            'description': a.description,
            'image_path': a.image_path,
            'activity_date': a.activity_date.isoformat() if a.activity_date else None
        } for a in activities]
        return jsonify({'success': True, 'data': data}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
