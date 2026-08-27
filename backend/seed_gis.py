import csv
import random
from app import create_app
from app.db.database import db
from app.db.models import Farm, GisLayer

CSV_PATH = "/home/thomas/Downloads/df_sentinel2sr_lucas(1)(1).csv"

# Threshold anomali per parameter
ANOMALY_THRESHOLDS = {
    'ndvi':    lambda v: v < 0.4,
    'soc':     lambda v: v < 30.0,
    'biomass': lambda v: v < 80.0,
    'yield':   lambda v: v < 1.2,
    'soilnpk': lambda v: v < 100.0,
}

UNITS = {
    'ndvi': 'index',
    'soc': 'Ton C/Ha',
    'biomass': 'Kg C/Ha',
    'yield': 'Ton/Ha',
    'soilnpk': 'kg NPK/Ha',
}

FRONTEND_PERIODS = ['Q1_2025', 'Q2_2025', 'Q3_2025', 'Q4_2025', 'Q1_2026']

def parse_boundary_bbox(farm):
    if farm.boundary is None:
        return None
    try:
        from geoalchemy2.functions import ST_XMin, ST_XMax, ST_YMin, ST_YMax
        xmin = db.session.scalar(ST_XMin(farm.boundary))
        xmax = db.session.scalar(ST_XMax(farm.boundary))
        ymin = db.session.scalar(ST_YMin(farm.boundary))
        ymax = db.session.scalar(ST_YMax(farm.boundary))
        if None in (xmin, xmax, ymin, ymax):
            return None
        return (float(ymin), float(ymax), float(xmin), float(xmax))
    except Exception as e:
        print(f"  [WARN] Gagal baca boundary: {e}")
        return None

def random_point_in_bbox(bbox):
    min_lat, max_lat, min_lon, max_lon = bbox
    lat = random.uniform(min_lat, max_lat)
    lon = random.uniform(min_lon, max_lon)
    return lat, lon

def normalize_biomass(oc_value): return round(oc_value * 1.45, 2)
def normalize_yield(ndvi_value): return round(max(0.3, ndvi_value * 3.8), 2)
def normalize_soilnpk(oc_value): return round(min(280, max(60, oc_value * 3.2)), 2)

def seed_gis_layers():
    app = create_app()
    with app.app_context():
        farms = Farm.query.all()
        if not farms:
            print("[ERROR] Tidak ada farm di DB.")
            return

        with open(CSV_PATH, newline='') as f:
            rows = list(csv.DictReader(f))

        print(f"Data CSV dimuat: {len(rows)} baris")
        print(f"Farm ditemukan: {len(farms)} farm\n")

        total_inserted = 0

        for farm in farms:
            bbox = parse_boundary_bbox(farm)
            if bbox is None: continue
            
            # Hapus data lama agar tidak dobel
            GisLayer.query.filter_by(farm_id=farm.id).delete()
            db.session.commit()

            # Buat data untuk tiap periode yang ada di frontend
            layers_to_add = []
            
            for period in FRONTEND_PERIODS:
                # Ambil 50 baris acak dari CSV untuk setiap periode di tiap farm
                sampled_rows = random.sample(rows, min(50, len(rows)))
                
                for row in sampled_rows:
                    try:
                        ndvi_val  = float(row['NDVI'])
                        oc_val    = float(row['OC'])
                        lat, lon  = random_point_in_bbox(bbox)

                        param_values = {
                            'ndvi':    ndvi_val,
                            'soc':     round(oc_val, 4),
                            'biomass': normalize_biomass(oc_val),
                            'yield':   normalize_yield(ndvi_val),
                            'soilnpk': normalize_soilnpk(oc_val),
                        }

                        for param, value in param_values.items():
                            layers_to_add.append(GisLayer(
                                farm_id=farm.id,
                                coordinate=f'SRID=4326;POINT({lon} {lat})',
                                parameter_type=param,
                                period=period,
                                numerical_value=value,
                                unit=UNITS[param],
                                is_anomaly=ANOMALY_THRESHOLDS[param](value),
                                source='Sentinel-2 (LUCAS)'
                            ))
                    except Exception as e:
                        continue

            db.session.bulk_save_objects(layers_to_add)
            db.session.commit()
            total_inserted += len(layers_to_add)
            print(f"  Inserted {len(layers_to_add)} records for farm '{farm.name}'")

        print(f"\nBerhasil inject total {total_inserted} data dari CSV ke database!")

if __name__ == '__main__':
    seed_gis_layers()
