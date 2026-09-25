import os
import json
from app import create_app
from app.db.database import db
from app.db.models import User, Company, Project, ProjectPermission, Farm, Farmer
from geoalchemy2.elements import WKTElement
from sqlalchemy import func
import bcrypt

app = create_app()

COMPANY_NAME = "PT Uji coba"
LOCATION = "Purwakarta, Jawa Barat"
GEOJSON_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'seed_data', 'purwakarta')

# Satu file GeoJSON = satu lahan. Semua blok di dalam file digabung jadi satu MultiPolygon
# supaya client melihatnya sebagai satu lahan, bukan puluhan blok kecil.
# area_eksisting_tanpa_jalan.geojson = 21 blok area_eksisting_tanpa_garis.geojson yang jalan
# di antaranya ditutup jadi satu polygon; luas_ha tetap luas bersih 21 blok (tanpa jalan).
AREAS = [
    {"file": "area_eksisting_tanpa_jalan.geojson", "name": "Lahan 1 Uji Coba", "farmer": "Petani 1", "label": "area eksisting"},
    {"file": "area_penambahan_tanpa_garis.geojson", "name": "Lahan 2 Uji Coba", "farmer": "Petani 2", "label": "areal penambahan"},
]


def get_password_hash(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def load_area(filepath):
    """Gabungkan semua feature Polygon dalam file jadi satu WKT MULTIPOLYGON + total luas (ha)."""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if data.get('type') != 'FeatureCollection' or not data.get('features'):
        raise ValueError(f"{filepath}: diharapkan FeatureCollection yang berisi minimal satu feature.")

    polygons, total_ha = [], 0.0
    for i, ft in enumerate(data['features']):
        geometry = ft['geometry']
        if geometry.get('type') != 'Polygon':
            raise ValueError(f"{filepath}#{i}: hanya geometry Polygon yang didukung, dapat '{geometry.get('type')}'.")
        rings = ", ".join(
            "(" + ", ".join(f"{lon} {lat}" for lon, lat in ring) + ")"
            for ring in geometry['coordinates']
        )
        polygons.append(f"({rings})")
        total_ha += float(ft.get('properties', {}).get('luas_ha', 0))

    return f"MULTIPOLYGON({', '.join(polygons)})", len(polygons), round(total_ha, 2)


def to_boundary(wkt_geom):
    # ST_MakeValid: Blok Eksisting 4 punya ring self-intersection.
    # ST_CollectionExtract(..., 3) membuang sisa titik/garis hasil perbaikan, lalu
    # ST_UnaryUnion melebur blok yang bersentuhan; hasilnya Polygon kalau cuma satu bagian.
    return func.ST_UnaryUnion(
        func.ST_CollectionExtract(func.ST_MakeValid(WKTElement(wkt_geom, srid=4326)), 3)
    )


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

    for area in AREAS:
        farmer = Farmer(
            company_id=company.id,
            name=area["farmer"],
            address=LOCATION,
            farm_info=f"Petani penggarap {area['label']}",
        )
        wkt_geom, block_count, total_ha = load_area(os.path.join(GEOJSON_DIR, area["file"]))
        farm = Farm(
            project_id=project.id,
            name=area["name"],
            location=LOCATION,
            total_area_ha=total_ha,
            boundary=to_boundary(wkt_geom),
            created_by=manager.id,
            status="active",
        )
        farm.farmers.append(farmer)
        db.session.add_all([farmer, farm])
        db.session.commit()

        print(f"Lahan '{area['name']}' ({block_count} blok, {total_ha:.2f} ha) ditanam, digarap oleh {area['farmer']}.")

    print(f"Seed data {COMPANY_NAME} berhasil. Login: manager_p / board_p (password123).")


if __name__ == "__main__":
    with app.app_context():
        seed_super_admin()
        seed_purwakarta_data()
