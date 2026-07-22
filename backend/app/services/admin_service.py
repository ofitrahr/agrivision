from app.db.database import db
from app.db.models import Company, User, Farm, Batch

def get_dashboard_stats():
    total_companies = Company.query.count() 
    active_companies = Company.query.filter_by(is_active= True).count()
    total_farms = Farm.query.count()
    total_users = User.query.count()
    total_batches = Batch.query.count()

    return {
        "success" : True,
        "data" : {
            "total_companies" : total_companies,
            "active_companies" : active_companies,
            "total_farms" : total_farms,
            "total_users" : total_users,
            "total_batches" : total_batches
        }
    }

def get_all_companies():
    companies = Company.query.order_by(Company.created_at.desc()).all()

    result = []
    for c in companies:
        result.append({
            "id" : str(c.id),
            "name" : c.name,
            "subscription_plan" : c.subscription_plan,
            "max_farms" : c.max_farms,
            "max_users" : c.max_users,
            "is_active" : c.is_active,
            "created_at" : c.created_at,
        })
    
    return ({"success": True, "data" : result})