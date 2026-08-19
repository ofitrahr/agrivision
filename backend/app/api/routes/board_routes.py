from flask import Blueprint, jsonify
from app.core.security import token_required, role_required
from app.db.models import Farm, Farmer, User, FarmCrop
from app.db.database import db
from sqlalchemy import func

board_bp = Blueprint('board_bp', __name__)

@board_bp.route('/dashboard/summary', methods=['GET'])
@token_required
@role_required('board')
def get_dashboard_summary(current_user):
    project = current_user.project
    company_id = project.company_id if project else None
    from app.db.models import FinancialRecord
    
    try:
        # Metrik Utama
        project_id = current_user.project_id
        
        farms = Farm.query.filter_by(project_id=project_id).all() if project_id else []
        farms_count = len(farms)
        total_area = sum([float(f.total_area_ha) for f in farms if f.total_area_ha])
        
        # Ambil data petani (berdasarkan perusahaan / penugasan lahan)
        if company_id:
            farmers = Farmer.query.filter_by(company_id=company_id).all()
        elif project_id:
            farmers = Farmer.query.join(Farmer.farms).filter(Farm.project_id == project_id).distinct().all()
        else:
            farmers = []
        farmers_count = len(farmers)
        
        # Distribusi Jenis Tanaman (Ekologi / Biodiversity)
        crop_distribution = {}
        for f in farms:
            area = float(f.total_area_ha) if f.total_area_ha else 0
            if area <= 0:
                continue
            
            crops = FarmCrop.query.filter_by(farm_id=f.id).all()
            if crops:
                area_per_crop = area / len(crops)
                for c in crops:
                    crop_name = c.crop_type or f.crop_variety or 'Tidak Diketahui'
                    crop_distribution[crop_name] = crop_distribution.get(crop_name, 0) + area_per_crop
            else:
                crop_name = f.crop_variety or (project.commodity if project and project.commodity else 'Tanaman Utama')
                crop_distribution[crop_name] = crop_distribution.get(crop_name, 0) + area
                
        crop_chart_data = [{"name": k, "value": round(v, 2)} for k, v in crop_distribution.items()]
        
        # Demografi Pekerja (Gender)
        gender_dist = {"Laki-laki": 0, "Perempuan": 0, "Tidak Diketahui": 0}
        for f in farmers:
            g = f.gender if f.gender else "Tidak Diketahui"
            if g in gender_dist:
                gender_dist[g] += 1
            else:
                gender_dist[g] = 1
                
        gender_chart_data = [{"name": k, "value": v} for k, v in gender_dist.items() if v > 0]
        
        # Demografi Pekerja (Usia)
        age_dist = {"<20 Tahun": 0, "20-30 Tahun": 0, "31-40 Tahun": 0, "41-50 Tahun": 0, ">50 Tahun": 0, "Tidak Diketahui": 0}
        for f in farmers:
            if not f.age:
                age_dist["Tidak Diketahui"] += 1
            elif f.age < 20:
                age_dist["<20 Tahun"] += 1
            elif f.age <= 30:
                age_dist["20-30 Tahun"] += 1
            elif f.age <= 40:
                age_dist["31-40 Tahun"] += 1
            elif f.age <= 50:
                age_dist["41-50 Tahun"] += 1
            else:
                age_dist[">50 Tahun"] += 1
        age_chart_data = [{"name": k, "value": v} for k, v in age_dist.items() if v > 0]
        
        # Agregasi Data Ekonomi 
        farm_ids = [f.id for f in farms]
        if farm_ids:
            fin_records = FinancialRecord.query.filter(
                (FinancialRecord.farm_id.in_(farm_ids)) |
                ((FinancialRecord.company_id == company_id) & (FinancialRecord.farm_id.is_(None)))
            ).order_by(FinancialRecord.created_at.asc()).all()
        elif company_id:
            fin_records = FinancialRecord.query.filter_by(company_id=company_id).order_by(FinancialRecord.created_at.asc()).all()
        else:
            fin_records = []

        total_revenue = sum([float(r.estimated_revenue) for r in fin_records if r.estimated_revenue])
        total_cost = sum([float(r.operational_cost) for r in fin_records if r.operational_cost])
        total_profit = total_revenue - total_cost
        
        # Grafik Ekonomi per Periode
        period_data = {}
        for r in fin_records:
            p = r.period
            if p not in period_data:
                period_data[p] = {'revenue': 0, 'cost': 0, 'profit': 0}
            period_data[p]['revenue'] += float(r.estimated_revenue or 0)
            period_data[p]['cost'] += float(r.operational_cost or 0)
            period_data[p]['profit'] += float((r.estimated_revenue or 0) - (r.operational_cost or 0))
            
        financial_chart_data = [
            {"period": k, "revenue": v['revenue'], "cost": v['cost'], "profit": v['profit']}
            for k, v in sorted(period_data.items())
        ]
        
        return jsonify({
            'success': True,
            'data': {
                'metrics': {
                    'total_farms': farms_count,
                    'total_farmers': farmers_count,
                    'total_area_ha': round(total_area, 2),
                    'total_revenue': total_revenue,
                    'total_cost': total_cost,
                    'total_profit': total_profit
                },
                'charts': {
                    'crop_distribution': crop_chart_data,
                    'gender_distribution': gender_chart_data,
                    'age_distribution': age_chart_data,
                    'financial_trends': financial_chart_data
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
