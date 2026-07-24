from flask import Blueprint, jsonify
from app.core.security import token_required, role_required
from app.db.models import Farm, FarmBlock, Farmer, User
from app.db.database import db
from sqlalchemy import func

board_bp = Blueprint('board_bp', __name__)

@board_bp.route('/dashboard/summary', methods=['GET'])
@token_required
@role_required('board')
def get_dashboard_summary(current_user):
    company_id = current_user.company_id
    from app.db.models import FinancialRecord
    
    try:
        # Metrik Utama
        farms_count = Farm.query.filter_by(company_id=company_id).count()
        farmers_count = Farmer.query.filter_by(company_id=company_id).count()
        
        blocks = db.session.query(FarmBlock).join(Farm).filter(Farm.company_id == company_id).all()
        total_area = sum([float(b.area_ha) for b in blocks if b.area_ha])
        
        # Distribusi Jenis Tanaman (Ekologi)
        crop_distribution = {}
        for b in blocks:
            crop = b.crop_type or 'Tidak Diketahui'
            area = float(b.area_ha) if b.area_ha else 0
            if crop in crop_distribution:
                crop_distribution[crop] += area
            else:
                crop_distribution[crop] = area
                
        crop_chart_data = [{"name": k, "value": round(v, 2)} for k, v in crop_distribution.items()]
        
        # Demografi Pekerja (Sosial) - Gender
        farmers = Farmer.query.filter_by(company_id=company_id).all()
        gender_dist = {"Laki-laki": 0, "Perempuan": 0, "Tidak Diketahui": 0}
        for f in farmers:
            g = f.gender if f.gender else "Tidak Diketahui"
            if g in gender_dist:
                gender_dist[g] += 1
            else:
                gender_dist[g] = 1
                
        gender_chart_data = [{"name": k, "value": v} for k, v in gender_dist.items() if v > 0]
        
        # Agregasi Data Ekonomi (Dari FinancialRecords)
        fin_records = FinancialRecord.query.filter_by(company_id=company_id).all()
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
                    'financial_trends': financial_chart_data
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
