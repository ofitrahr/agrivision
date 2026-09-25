import os
import json
from app import create_app
from app.db.database import db
from app.db.models import User, Company, Project, ProjectPermission, Farm, Farmer
from sqlalchemy import func, select
import bcrypt

app = create_app()

COMPANY_NAME = "PT Uji coba"
LOCATION = "Purwakarta, Jawa Barat"
GEOJSON_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'seed_data', 'purwakarta')

# Area_Eksisting_Clean.json (17 poligon) + Areal_Penambahan.geojson digabung jadi satu lahan.
FARM_NAME = "Lahan Uji Coba"
FARM_GEOJSON = "area_eksisting_dan_penambahan.geojson"
FARMERS = [
    {"name": "Petani 1", "label": "area eksisting"},
    {"name": "Petani 2", "label": "areal penambahan"},
]


def get_password_hash(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def load_boundary(filepath):
    """Semua feature Polygon/MultiPolygon di file digabung jadi satu MultiPolygon GeoJSON."""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    polygons = []
    for ft in data.get('features', []):
        geometry = ft.get('geometry') or {}
        if geometry.get('type') == 'Polygon':
            polygons.append(geometry['coordinates'])
        elif geometry.get('type') == 'MultiPolygon':
            polygons.extend(geometry['coordinates'])
    if not polygons:
        raise ValueError(f"{filepath}: tidak ada feature Polygon/MultiPolygon.")

    return {'type': 'MultiPolygon', 'coordinates': polygons}


def to_boundary(geojson_geom):
    # Sama dengan create_farm di admin_routes: lubang ikut terbaca, poligon tidak valid dirapikan,
    # bagian yang bersentuhan dilebur, dan koordinat Z dibuang.
    return func.ST_UnaryUnion(func.ST_CollectionExtract(func.ST_MakeValid(
        func.ST_Force2D(func.ST_SetSRID(func.ST_GeomFromGeoJSON(json.dumps(geojson_geom)), 4326))
    ), 3))


def seed_super_admin():
    # Company terpisah dari Purwakarta supaya seed ulang Purwakarta (delete cascade)
    # tidak ikut menghapus superadmin.
    if User.query.filter_by(username="superadmin").first():
        print("Superadmin sudah ada, dilewati.")
        return

    company = Company(name="Agrivision Master", description="Induk Sistem")
    db.session.add(company)
    db.session.commit()

    project = Project(name="Default Project", description="Proyek Utama", company_id=company.id)
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
    db.session.add(User(
        project_id=project.id,
        username="superadmin",
        password_hash=get_password_hash("password123"),
        full_name="Super Administrator",
        role="super_admin",
    ))
    db.session.commit()
    print("Superadmin berhasil ditanam (superadmin / password123).")


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

    geojson_geom = load_boundary(os.path.join(GEOJSON_DIR, FARM_GEOJSON))
    total_ha = round(float(db.session.scalar(
        select(func.ST_Area(func.Geography(to_boundary(geojson_geom))) / 10000)
    )), 2)

    farm = Farm(
        project_id=project.id,
        name=FARM_NAME,
        location=LOCATION,
        total_area_ha=total_ha,
        boundary=to_boundary(geojson_geom),
        created_by=manager.id,
        status="active",
    )
    for f in FARMERS:
        farm.farmers.append(Farmer(
            company_id=company.id,
            name=f["name"],
            address=LOCATION,
            farm_info=f"Petani penggarap {f['label']}",
        ))
    db.session.add(farm)
    db.session.commit()

    print(f"Lahan '{FARM_NAME}' ({len(geojson_geom['coordinates'])} bagian, {total_ha:.2f} ha) ditanam, "
          f"digarap oleh {', '.join(f['name'] for f in FARMERS)}.")
    print(f"Seed data {COMPANY_NAME} berhasil. Login: manager_p / board_p (password123).")


if __name__ == "__main__":
    with app.app_context():
        seed_super_admin()
        seed_purwakarta_data()
