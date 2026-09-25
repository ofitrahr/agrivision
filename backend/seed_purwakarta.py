import os
import json
from app import create_app
from app.db.database import db
from app.db.models import User, Company, Project, ProjectPermission, Farm, Farmer
from geoalchemy2.elements import WKTElement
from sqlalchemy import func
import bcrypt

app = create_app()

COMPANY_NAME = "PT Purwa Agro Lestari"
LOCATION = "Purwakarta, Jawa Barat"
GEOJSON_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'seed_data', 'purwakarta')

# Tiap feature Polygon jadi satu Farm, karena Farm.boundary hanya menerima POLYGON.
AREAS = [
    {"file": "area_eksisting_tanpa_garis.geojson", "farmer": "Petani 1", "label": "area eksisting"},
    {"file": "area_penambahan_tanpa_garis.geojson", "farmer": "Petani 2", "label": "areal penambahan"},
]


def get_password_hash(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def load_polygon_features(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if data.get('type') != 'FeatureCollection' or not data.get('features'):
        raise ValueError(f"{filepath}: diharapkan FeatureCollection yang berisi minimal satu feature.")

    result = []
    for i, ft in enumerate(data['features']):
        geometry = ft['geometry']
        if geometry.get('type') != 'Polygon':
            raise ValueError(f"{filepath}#{i}: hanya geometry Polygon yang didukung, dapat '{geometry.get('type')}'.")
        rings = ", ".join(
            "(" + ", ".join(f"{lon} {lat}" for lon, lat in ring) + ")"
            for ring in geometry['coordinates']
        )
        result.append((ft.get('properties', {}), f"POLYGON({rings})"))
    return result


def seed_purwakarta_data():
    deleted = Company.query.filter_by(name=COMPANY_NAME).delete(synchronize_session=False)
    db.session.commit()
    if deleted:
        print(f"Menghapus data lama {COMPANY_NAME} beserta seluruh data terkait (cascade).")

    company = Company(
        name=COMPANY_NAME,
        description="Akun uji coba lahan",
        address=LOCATION,
        subscription_plan="Enterprise",
        max_farms=30,
        max_users=20,
        branding_color="#116a3a",
    )
    db.session.add(company)
    db.session.commit()

    project = Project(
        company_id=company.id,
        name="Lahan Uji coba",
        description="Pemetaan area eksisting dan area penambahan lahan Uji Coba.",
        location=LOCATION,
    )
    db.session.add(project)
    db.session.commit()

    db.session.add(ProjectPermission(
        project_id=project.id,
        module_gis=True,
        module_traceability=True,
        module_agronomy=True,
        module_board_reports=True,
        can_access_ndvi=True,
        can_access_soc=True,
        can_access_yield=True,
        can_access_biomass=True,
        can_access_soilnpk=True,
    ))

    manager = User(
        project_id=project.id,
        username="manager_p",
        password_hash=get_password_hash("password123"),
        full_name="Manager Lahan Uji Coba",
        role="manager",
    )
    board = User(
        project_id=project.id,
        username="board_p",
        password_hash=get_password_hash("password123"),
        full_name="Board Uji Coba",
        role="board",
    )
    db.session.add_all([manager, board])
    db.session.commit()

    for area in AREAS:
        farmer = Farmer(
            company_id=company.id,
            name=area["farmer"],
            address=LOCATION,
            farm_info=f"Petani penggarap {area['label']} Purwakarta",
        )
        db.session.add(farmer)

        features = load_polygon_features(os.path.join(GEOJSON_DIR, area["file"]))
        for props, wkt_geom in features:
            farm = Farm(
                project_id=project.id,
                name=f"{props['nama']} - Purwakarta",
                location=LOCATION,
                total_area_ha=props['luas_ha'],
                # Blok Eksisting 4 punya ring self-intersection; ST_MakeValid memperbaikinya
                # tetap sebagai satu POLYGON dengan luas yang sama.
                boundary=func.ST_MakeValid(WKTElement(wkt_geom, srid=4326)),
                created_by=manager.id,
                status="active",
            )
            farm.farmers.append(farmer)
            db.session.add(farm)
        db.session.commit()

        total_ha = sum(props['luas_ha'] for props, _ in features)
        print(f"{len(features)} lahan {area['label']} ({total_ha:.2f} ha) ditanam, digarap oleh {area['farmer']}.")

    print(f"Seed data {COMPANY_NAME} berhasil. Login: manager_purwakarta / board_purwakarta (password123).")


if __name__ == "__main__":
    with app.app_context():
        seed_purwakarta_data()
