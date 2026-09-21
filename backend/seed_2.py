import json
import os
import random
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

import bcrypt
from app import create_app
from app.core.period_utils import period_label, shift_period
from app.db.database import db
from app.db.models import (
    ActivityLog,
    AgronomyActivity,
    AssessmentAnswer,
    AssessmentSdgResult,
    Batch,
    BatchCheckpoint,
    Company,
    CompanySdg,
    CompanySdgVerification,
    DocumentReport,
    EsgMetric,
    Farm,
    FarmCrop,
    Farmer,
    FinancialRecord,
    GisLayer,
    HarvestRecord,
    Project,
    ProjectPermission,
    ProjectSdg,
    ProjectSdgVerification,
    ProjectTraceability,
    ProjectTraceabilityProfile,
    QrCode,
    Question,
    QuestionIndicator,
    QuestionOption,
    QuestionSection,
    Questionnaire,
    RecentActivity,
    Sdg,
    SdgIndicator,
    SdgMaster,
    SensorData,
    TraceAssessment,
    TraceTemplate,
    TraceTemplateStep,
    User,
    farm_farmers,
)
from app.services.assessment_service import _calculate_sdg
from geoalchemy2.elements import WKTElement
from sqlalchemy import text

app = create_app()

SDG_CATALOG = [
    (1, "No Poverty", "Menghapus kemiskinan dalam segala bentuknya di mana-mana"),
    (2, "Zero Hunger", "Menghapus kelaparan, mencapai ketahanan pangan dan gizi yang lebih baik, dan mendukung pertanian berkelanjutan"),
    (3, "Good Health and Well-being", "Memastikan kehidupan yang sehat dan mendukung kesejahteraan bagi semua orang di segala usia"),
    (4, "Quality Education", "Memastikan pendidikan yang inklusif dan bermutu serta mendukung kesempatan belajar sepanjang hayat"),
    (5, "Gender Equality", "Mencapai kesetaraan gender dan memberdayakan semua perempuan dan anak perempuan"),
    (6, "Clean Water and Sanitation", "Memastikan ketersediaan dan pengelolaan air bersih serta sanitasi yang berkelanjutan untuk semua"),
    (7, "Affordable and Clean Energy", "Memastikan akses terhadap energi yang terjangkau, andal, berkelanjutan, dan modern untuk semua"),
    (8, "Decent Work and Economic Growth", "Mendukung pertumbuhan ekonomi yang inklusif dan berkelanjutan, pekerjaan yang layak bagi semua"),
    (9, "Industry, Innovation and Infrastructure", "Membangun infrastruktur yang tangguh, mendukung industrialisasi inklusif, dan mendorong inovasi"),
    (10, "Reduced Inequalities", "Mengurangi ketimpangan di dalam dan antar negara"),
    (11, "Sustainable Cities and Communities", "Membangun kota dan pemukiman yang inklusif, aman, tangguh, dan berkelanjutan"),
    (12, "Responsible Consumption and Production", "Memastikan pola konsumsi dan produksi yang berkelanjutan"),
    (13, "Climate Action", "Mengambil tindakan segera untuk memerangi perubahan iklim dan dampaknya"),
    (14, "Life Below Water", "Melestarikan dan memanfaatkan samudera, laut, dan sumber daya kelautan secara berkelanjutan"),
    (15, "Life on Land", "Melindungi, memulihkan, dan mendukung pemanfaatan ekosistem daratan secara berkelanjutan"),
    (16, "Peace, Justice and Strong Institutions", "Mendukung masyarakat yang damai dan inklusif serta institusi yang kuat"),
    (17, "Partnerships for the Goals", "Memperkuat sarana pelaksanaan dan menghidupkan kembali kemitraan global untuk pembangunan berkelanjutan"),
]


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def seed_sdg_catalog():
    if Sdg.query.count() == 0:
        for num, title, goal in SDG_CATALOG:
            db.session.add(
                Sdg(
                    code=str(num),
                    title=title,
                    goal=goal,
                    image_url=f"/static/uploads/sdg-logos/{num}.png",
                )
            )
        db.session.commit()
        print(f"[SDG Catalog] Berhasil menanam {len(SDG_CATALOG)} data SDG.")
    else:
        print("[SDG Catalog] Katalog SDG sudah ada, melewati proses seed katalog.")


def seed_super_admin():
    admin = User.query.filter_by(username="superadmin").first()
    if admin:
        print("[Super Admin] superadmin sudah ada di database.")
        return admin

    master_company = Company.query.filter_by(name="Agrivision Master").first()
    if not master_company:
        master_company = Company(
            name="Agrivision Master",
            description="Induk Pengelola Sistem AgriVision",
            is_active=True,
        )
        db.session.add(master_company)
        db.session.commit()

    master_project = Project.query.filter_by(name="Default Project").first()
    if not master_project:
        master_project = Project(
            name="Default Project",
            description="Proyek Utama Administrasi Sistem",
            company_id=master_company.id,
            status="active",
        )
        db.session.add(master_project)
        db.session.commit()

    perm = ProjectPermission.query.filter_by(project_id=master_project.id).first()
    if not perm:
        perm = ProjectPermission(
            project_id=master_project.id,
            module_gis=True,
            module_traceability=True,
            module_agronomy=True,
            module_board_reports=True,
            can_access_ndvi=True,
            can_access_soc=True,
            can_access_yield=True,
            can_access_biomass=True,
            can_access_soilnpk=True,
        )
        db.session.add(perm)
        db.session.commit()

    admin = User(
        project_id=master_project.id,
        username="superadmin",
        email="superadmin@agrivision.id",
        password_hash=get_password_hash("password123"),
        full_name="Super Administrator",
        role="super_admin",
        is_active=True,
    )
    db.session.add(admin)
    db.session.commit()
    print("[Super Admin] Akun superadmin berhasil dibuat (password: password123).")
    return admin


def clear_existing_data():
    print("[Clean] Membersihkan data lama AgriCorp Indonesia...")
    existing_companies = Company.query.filter(
        Company.name.in_(["AgriCorp Indonesia", "AgriCorp Nusantara"])
    ).all()
    for comp in existing_companies:
        db.session.delete(comp)

    # Bersihkan sisa akun jika ada
    User.query.filter(User.username.in_(["manager_agri", "investor_agri"])).delete(
        synchronize_session=False
    )
    RecentActivity.query.delete()
    ActivityLog.query.delete()

    db.session.commit()
    print("[Clean] Pembersihan data selesai.")


def run_complete_seed():
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # -------------------------------------------------------------
    # 1. Company
    # -------------------------------------------------------------
    company = Company(
        name="AgriCorp Indonesia",
        description="Perusahaan Agrikultur Berkelanjutan & Ekspor Komoditas Kopi Nusantara",
        address="Gedung Bursa Efek Indonesia Tower 2 Lt. 18, SCBD, Jakarta Selatan",
        email="contact@agricorp.id",
        phone="021-5152345",
        subscription_plan="Enterprise",
        max_farms=100,
        max_users=50,
        branding_color="#1B4332",
        is_active=True,
    )
    db.session.add(company)
    db.session.commit()
    print(f"[1/11] Perusahaan '{company.name}' berhasil dibuat.")

    # Company SDG Verification & Company SDGs
    db.session.add(
        CompanySdgVerification(
            company_id=company.id,
            assessed_by="PT Sucofindo & SGS International",
            evidence_file_url="https://example.com/audit_agricorp_sdg_2025.pdf",
            evidence_file_type="pdf",
            assessment_date=datetime(2025, 12, 18, 10, 0),
        )
    )

    sdgs_selected = Sdg.query.filter(
        Sdg.code.in_(["1", "2", "8", "12", "13", "15"])
    ).all()
    for i, s in enumerate(sdgs_selected):
        db.session.add(
            CompanySdg(
                company_id=company.id,
                sdg_id=s.id,
                description=f"Inisiatif terverifikasi perusahaan untuk mendukung {s.title}",
                display_order=i,
            )
        )
    db.session.commit()

    # -------------------------------------------------------------
    # 2. Project & Permissions & Traceability Profiles
    # -------------------------------------------------------------
    project = Project(
        company_id=company.id,
        name="Kopi Mandailing Lestari",
        description="Pengembangan rantai pasok kopi arabika specialty berkelanjutan berbasis agroforestri dan pemantauan spasial satelit.",
        commodity="Kopi Arabika",
        location="Mandailing Natal, Sumatera Utara",
        status="active",
    )
    db.session.add(project)
    db.session.commit()

    db.session.add(
        ProjectPermission(
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
        )
    )

    # Legacy Traceability Model
    db.session.add(
        ProjectTraceability(
            project_id=project.id,
            hero_image_url="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=1200&q=80",
            origin_story="Berasal dari dataran tinggi vulkanik Mandailing Natal pada elevasi 1.250-1.400 mdpl. Ditanam secara organik di bawah naungan pohon penaung alami oleh petani lokal.",
            social_description="Kemitraan berkeadilan dengan 120+ keluarga petani lokal, menjamin upah di atas standar dan perlindungan jaminan sosial.",
            economic_description="Peningkatan pendapatan petani sebesar 28.5% melalui akses langsung ke pasar ekspor specialty dan premi kualitas.",
            environmental_description="Konservasi tanah berbasis agroforestri, tanpa deforestasi, menjaga cadangan karbon tanah (SOC) dan keanekaragaman hayati.",
            is_published=True,
        )
    )

    # New Traceability Profile Model
    trace_profile = ProjectTraceabilityProfile(
        project_id=project.id,
        title="Kopi Mandailing Lestari - Single Origin Traceability",
        tagline="Harmoni Kopi Nusantara, Kesejahteraan Petani, dan Konservasi Ekosistem",
        hero_image_url="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=1200&q=80",
        origin_story="Ditanam di lereng pegunungan Sorik Marapi, Mandailing Natal. Tanah vulkanik yang subur dipadukan dengan iklim mikro pegunungan menghasilkan profil rasa yang kompleks dengan body tebal dan acidity seimbang.",
        description="Program integrasi hulu-hilir kopi specialty berstandar ESG global dengan sistem monitoring satelit dan keterlacakan batch terverifikasi.",
        social_narrative="Pemberdayaan kelompok wanita tani dalam proses seleksi sortasi ceri kopi dan penyediaan perlindungan keselamatan kerja bagi seluruh petani mitra.",
        economic_narrative="Pemberian harga premium di atas pasar komoditas reguler serta pembiayaan sarana produksi ramah lingkungan berbunga rendah.",
        environmental_narrative="Penerapan rorak penahan erosi, pemanfaatan limbah pulp sebagai pupuk kompos organik, dan proteksi tutupan hutan di sekeliling kebun.",
        status="published",
    )
    db.session.add(trace_profile)
    db.session.commit()
    print(f"[2/11] Proyek '{project.name}' dan profil ketertelusuran berhasil diinisialisasi.")

    # -------------------------------------------------------------
    # 3. Users (Akun Manager & Investor / Board)
    # -------------------------------------------------------------
    manager = User(
        project_id=project.id,
        username="manager_agri",
        email="manager@agricorp.id",
        password_hash=get_password_hash("password123"),
        full_name="Budi Pratama (Manager Operasional)",
        phone="081122334455",
        role="manager",
        is_active=True,
    )
    investor = User(
        project_id=project.id,
        username="investor_agri",
        email="investor@agricorp.id",
        password_hash=get_password_hash("password123"),
        full_name="Dewi Sartika (Direksi / Investor)",
        phone="081199887766",
        role="board",
        is_active=True,
    )
    db.session.add_all([manager, investor])
    db.session.commit()
    print(
        "[3/11] Akun Pengguna siap:\n"
        "       - Superadmin: superadmin / password123\n"
        "       - Manager:    manager_agri / password123\n"
        "       - Investor:   investor_agri / password123"
    )

    # -------------------------------------------------------------
    # 4. Farmers (Data Petani Terdaftar Lengkap)
    # -------------------------------------------------------------
    farmers = [
        Farmer(
            company_id=company.id,
            name="Budi Santoso",
            address="Dusun Dolok Martimbang, Kec. Lembah Sorik Marapi",
            phone="081234567890",
            gender="Laki-laki",
            birth_year=1980,
            join_year=2020,
            farm_info="Ketua Kelompok Tani Dolok Jaya, spesialis budidaya kopi arabika Typica naungan gamal.",
            is_active=True,
        ),
        Farmer(
            company_id=company.id,
            name="Siti Aminah",
            address="Desa Aek Sibontar, Kec. Kotanopan",
            phone="081234567891",
            gender="Perempuan",
            birth_year=1988,
            join_year=2021,
            farm_info="Koordinator Petani Wanita Mandailing, instruktur pemetikan selektif dan sortasi ceri.",
            is_active=True,
        ),
        Farmer(
            company_id=company.id,
            name="Ucok Harahap",
            address="Desa Saba Dolok, Kec. Kotanopan",
            phone="081234567892",
            gender="Laki-laki",
            birth_year=1968,
            join_year=2019,
            farm_info="Petani senior berpengalaman 30 tahun dalam konservasi terasering dan pohon penaung kopi.",
            is_active=True,
        ),
        Farmer(
            company_id=company.id,
            name="Rahmawati Siregar",
            address="Dusun Dolok Martimbang, Kec. Lembah Sorik Marapi",
            phone="081234567893",
            gender="Perempuan",
            birth_year=1999,
            join_year=2023,
            farm_info="Petani milenial, operator IoT stasiun cuaca dan sensor kelembaban tanah digital.",
            is_active=True,
        ),
        Farmer(
            company_id=company.id,
            name="Hendra Wijaya",
            address="Kecamatan Tapung Hilir, Kab. Kampar, Riau",
            phone="081234567894",
            gender="Laki-laki",
            birth_year=1983,
            join_year=2021,
            farm_info="Kepala regu perkebunan kelapa sawit rakyat terintegrasi, spesialis pemupukan presisi.",
            is_active=True,
        ),
        Farmer(
            company_id=company.id,
            name="Nurul Hidayah",
            address="Desa Aek Sibontar, Kec. Kotanopan",
            phone="081234567895",
            gender="Perempuan",
            birth_year=1992,
            join_year=2022,
            farm_info="Auditor internal sertifikasi organik dan kepatuhan standar fair trade.",
            is_active=True,
        ),
    ]
    db.session.add_all(farmers)
    db.session.commit()
    print(f"[4/11] {len(farmers)} Petani mitra terdaftar berhasil ditambahkan.")

    # -------------------------------------------------------------
    # 5. Farms (Nama Lahan, Batas Poligon, dan Komoditas)
    # -------------------------------------------------------------
    # Poligon Lahan 1: Blok Dolok Martimbang (Mandailing Natal)
    poly1_coords = [
        [99.5500, 0.8500],
        [99.5560, 0.8500],
        [99.5560, 0.8440],
        [99.5500, 0.8440],
        [99.5500, 0.8500],
    ]
    wkt_poly1 = f"POLYGON(({', '.join(f'{c[0]} {c[1]}' for c in poly1_coords)}))"
    area1 = db.session.scalar(
        text("SELECT ST_Area(ST_GeomFromText(:wkt, 4326)::geography) / 10000;"),
        {"wkt": wkt_poly1},
    )

    farm1 = Farm(
        project_id=project.id,
        name="Blok Dolok Martimbang (Kopi Arabika)",
        location="Kec. Lembah Sorik Marapi, Mandailing Natal",
        crop_variety="Kopi Arabika",
        total_area_ha=round(float(area1), 2) if area1 else 43.80,
        altitude="1250 mdpl",
        agroforestry_system="Agroforestri Penaung Gamal & Sengon",
        boundary=WKTElement(wkt_poly1, srid=4326),
        created_by=manager.id,
        status="active",
    )

    # Poligon Lahan 2: Blok Aek Sibontar (Mandailing Natal)
    poly2_coords = [
        [99.5600, 0.8550],
        [99.5680, 0.8550],
        [99.5680, 0.8470],
        [99.5600, 0.8470],
        [99.5600, 0.8550],
    ]
    wkt_poly2 = f"POLYGON(({', '.join(f'{c[0]} {c[1]}' for c in poly2_coords)}))"
    area2 = db.session.scalar(
        text("SELECT ST_Area(ST_GeomFromText(:wkt, 4326)::geography) / 10000;"),
        {"wkt": wkt_poly2},
    )

    farm2 = Farm(
        project_id=project.id,
        name="Blok Aek Sibontar (Kopi Arabika)",
        location="Kec. Kotanopan, Mandailing Natal",
        crop_variety="Kopi Arabika",
        total_area_ha=round(float(area2), 2) if area2 else 76.50,
        altitude="1380 mdpl",
        agroforestry_system="Pola Tumpang Sari Jeruk & Kopi",
        boundary=WKTElement(wkt_poly2, srid=4326),
        created_by=manager.id,
        status="active",
    )

    # Poligon Lahan 3: Kebun Demo Sawit Kampar (Riau - Koordinat Demo GEE)
    poly3_coords = [
        [101.4000, 0.5000],
        [101.4100, 0.5000],
        [101.4100, 0.4900],
        [101.4000, 0.4900],
        [101.4000, 0.5000],
    ]
    wkt_poly3 = f"POLYGON(({', '.join(f'{c[0]} {c[1]}' for c in poly3_coords)}))"
    area3 = db.session.scalar(
        text("SELECT ST_Area(ST_GeomFromText(:wkt, 4326)::geography) / 10000;"),
        {"wkt": wkt_poly3},
    )

    farm3 = Farm(
        project_id=project.id,
        name="Kebun Demo Sawit Kampar (Demo 120 Ha)",
        location="Tapung Hilir, Kab. Kampar, Riau",
        crop_variety="Kelapa Sawit",
        total_area_ha=round(float(area3), 2) if area3 else 122.50,
        altitude="48 mdpl",
        agroforestry_system="Monokultur Terintegrasi Sawit",
        boundary=WKTElement(wkt_poly3, srid=4326),
        created_by=manager.id,
        status="active",
    )

    db.session.add_all([farm1, farm2, farm3])
    db.session.commit()

    # Assign Farmers ke masing-masing Lahan
    farm1.farmers.extend([farmers[0], farmers[1], farmers[3]])  # Budi, Siti, Rahmawati
    farm2.farmers.extend([farmers[1], farmers[2], farmers[5]])  # Siti, Ucok, Nurul
    farm3.farmers.append(farmers[4])  # Hendra
    db.session.commit()

    # Varietas Tanaman (FarmCrop)
    crops_data = [
        FarmCrop(farm_id=farm1.id, crop_type="Kopi Arabika Typica", area_ha=26.50),
        FarmCrop(farm_id=farm1.id, crop_type="Kopi Arabika Sigarar Utang", area_ha=17.30),
        FarmCrop(farm_id=farm2.id, crop_type="Kopi Arabika Kartika", area_ha=45.00),
        FarmCrop(farm_id=farm2.id, crop_type="Kopi Arabika Ateng Super", area_ha=31.50),
        FarmCrop(farm_id=farm3.id, crop_type="Kelapa Sawit Varietas Tenera", area_ha=122.50),
    ]
    db.session.add_all(crops_data)
    db.session.commit()
    print("[5/11] 3 Lahan komprehensif, penugasan petani, dan varietas tanaman berhasil dibuat.")

    # -------------------------------------------------------------
    # 6. Nilai-Nilai Index Observasi (GisLayer Spasial) & SensorData
    # -------------------------------------------------------------
    print("[6/11] Menanam titik observasi spasial satelit (NDVI, SOC, Biomassa, Yield, NPK) lintas 5 periode...")

    # 5 periode bulanan berurutan yang berakhir di bulan berjalan (format 'YYYY-MM')
    _today = date.today()
    periods = []
    for _offset in range(4, -1, -1):
        _y, _m = divmod((_today.year * 12 + (_today.month - 1)) - _offset, 12)
        periods.append(f"{_y:04d}-{_m + 1:02d}")
    period_idx_map = {p: i for i, p in enumerate(periods)}
    # Alias periode relatif dipakai pada data historis (2 bulan lalu, bulan lalu, bulan berjalan)
    period_prev2, period_prev1, period_curr = periods[2], periods[3], periods[4]
    period_next = shift_period(period_curr, 1)  # untuk yield_forecast

    def generate_grid_points(min_lon, max_lon, min_lat, max_lat, count=25):
        # 5x5 grid evenly spaced
        points = []
        step_x = (max_lon - min_lon) / 6
        step_y = (max_lat - min_lat) / 6
        for x in range(1, 6):
            for y in range(1, 6):
                lon = round(min_lon + x * step_x, 6)
                lat = round(min_lat + y * step_y, 6)
                points.append((lon, lat))
        return points[:count]

    farms_config = [
        {
            "farm": farm1,
            "points": generate_grid_points(99.5505, 99.5555, 0.8445, 0.8495, 25),
            "base_ndvi": 0.72,
            "base_soc": 46.5,
            "base_biomass": 138.0,
            "base_yield": 2.65,
            "base_soilnpk": 168.0,
            "base_n": 38.0,
            "base_p": 24.5,
            "base_k": 44.0,
        },
        {
            "farm": farm2,
            "points": generate_grid_points(99.5605, 99.5675, 0.8475, 0.8545, 25),
            "base_ndvi": 0.76,
            "base_soc": 52.0,
            "base_biomass": 155.0,
            "base_yield": 2.95,
            "base_soilnpk": 182.0,
            "base_n": 41.5,
            "base_p": 27.0,
            "base_k": 47.5,
        },
        {
            "farm": farm3,
            "points": generate_grid_points(101.4010, 101.4090, 0.4910, 0.4990, 25),
            "base_ndvi": 0.81,
            "base_soc": 41.0,
            "base_biomass": 172.0,
            "base_yield": 3.40,
            "base_soilnpk": 195.0,
            "base_n": 44.0,
            "base_p": 29.5,
            "base_k": 51.0,
        },
    ]

    UNITS = {
        "ndvi": "index",
        "soc": "Ton C/Ha",
        "biomass": "Kg C/Ha",
        "yield": "Ton/Ha",
        "yield_forecast": "Ton/Ha",
        "soilnpk": "kg NPK/Ha",
        "nitrogen": "kg/Ha",
        "phosphorus": "kg/Ha",
        "potassium": "kg/Ha",
    }
    ANOMALY_THRESH = {
        "ndvi": 0.40,
        "soc": 30.0,
        "biomass": 80.0,
        "yield": 1.20,
        "yield_forecast": 1.20,
        "soilnpk": 100.0,
        "nitrogen": 15.0,
        "phosphorus": 10.0,
        "potassium": 20.0,
    }

    gis_layers_to_insert = []
    sensor_records = []

    for f_cfg in farms_config:
        f_obj = f_cfg["farm"]
        pts = f_cfg["points"]

        for p_str in periods:
            p_step = period_idx_map[p_str]
            growth_factor = 1.0 + (p_step * 0.028)  # gradual improvement across months

            for idx, (lon, lat) in enumerate(pts):
                # Variasi spasial kecil per titik
                spatial_offset = ((idx % 5) - 2) * 0.015

                # 1 dari 25 titik dibuat anomali ringan untuk menguji deteksi anomali UI
                is_anomaly_point = (idx == 12)

                if is_anomaly_point:
                    val_ndvi = 0.35
                    val_soc = 26.5
                    val_biomass = 72.0
                    val_yield = 1.05
                    val_npk = 85.0
                    val_n = 12.0
                    val_p = 8.5
                    val_k = 16.0
                else:
                    val_ndvi = round(
                        min(0.92, max(0.55, f_cfg["base_ndvi"] * growth_factor + spatial_offset)),
                        4,
                    )
                    val_soc = round(
                        f_cfg["base_soc"] * growth_factor + (spatial_offset * 10), 3
                    )
                    val_biomass = round(
                        f_cfg["base_biomass"] * growth_factor + (spatial_offset * 20), 2
                    )
                    val_yield = round(
                        f_cfg["base_yield"] * growth_factor + (spatial_offset * 0.5), 2
                    )
                    val_npk = round(
                        f_cfg["base_soilnpk"] * growth_factor + (spatial_offset * 15), 2
                    )
                    val_n = round(
                        f_cfg["base_n"] * growth_factor + (spatial_offset * 5), 2
                    )
                    val_p = round(
                        f_cfg["base_p"] * growth_factor + (spatial_offset * 4), 2
                    )
                    val_k = round(
                        f_cfg["base_k"] * growth_factor + (spatial_offset * 6), 2
                    )

                measurements = {
                    "ndvi": val_ndvi,
                    "soc": val_soc,
                    "biomass": val_biomass,
                    "yield": val_yield,
                    "soilnpk": val_npk,
                    "nitrogen": val_n,
                    "phosphorus": val_p,
                    "potassium": val_k,
                }

                for p_type, num_val in measurements.items():
                    gis_layers_to_insert.append(
                        GisLayer(
                            farm_id=f_obj.id,
                            coordinate=f"SRID=4326;POINT({lon} {lat})",
                            parameter_type=p_type,
                            period=p_str,
                            numerical_value=num_val,
                            unit=UNITS[p_type],
                            is_anomaly=(num_val < ANOMALY_THRESH[p_type]),
                            source="Sentinel-2 + NASA SRTM Spasial Pipeline",
                        )
                    )

            # Sensor Data IoT untuk Lahan & Periode ini
            sensor_records.append(
                SensorData(
                    farm_id=f_obj.id,
                    period=p_str,
                    ph=round(6.4 + (p_step * 0.06), 2),
                    temperature=round(25.4 - (p_step * 0.1), 1),
                    ec=round(1.35 + (p_step * 0.05), 2),
                    humidity=round(82.0 + ((idx % 3) * 1.5), 1),
                )
            )

        # Tambahkan Forecast Yield untuk Periode Mendatang (1 bulan setelah periode berjalan)
        for idx, (lon, lat) in enumerate(pts):
            fc_val = round(f_cfg["base_yield"] * 1.18 + (((idx % 5) - 2) * 0.04), 2)
            gis_layers_to_insert.append(
                GisLayer(
                    farm_id=f_obj.id,
                    coordinate=f"SRID=4326;POINT({lon} {lat})",
                    parameter_type="yield_forecast",
                    period=period_next,
                    numerical_value=fc_val,
                    unit=UNITS["yield_forecast"],
                    is_anomaly=False,
                    source="AgriVision Predictive Yield AI",
                )
            )

    db.session.bulk_save_objects(gis_layers_to_insert)
    db.session.add_all(sensor_records)
    db.session.commit()
    print(f"       -> {len(gis_layers_to_insert)} baris GisLayer & {len(sensor_records)} SensorData berhasil disimpan.")

    # -------------------------------------------------------------
    # 7. Financial Records, Harvest Records, ESG Metrics
    # -------------------------------------------------------------
    fin_records = [
        # Farm 1 (Dolok Martimbang)
        FinancialRecord(
            company_id=company.id,
            farm_id=farm1.id,
            period=period_prev2,
            total_production_kg=16800.0,
            operational_cost=88000000.0,
            estimated_revenue=134000000.0,
            notes="Panen sela musim kemarau, kualitas biji grade 1.",
        ),
        FinancialRecord(
            company_id=company.id,
            farm_id=farm1.id,
            period=period_prev1,
            total_production_kg=19500.0,
            operational_cost=85000000.0,
            estimated_revenue=156000000.0,
            notes="Panen raya akhir tahun dengan penghematan efisiensi pupuk organik.",
        ),
        FinancialRecord(
            company_id=company.id,
            farm_id=farm1.id,
            period=period_curr,
            total_production_kg=23400.0,
            operational_cost=80000000.0,
            estimated_revenue=188000000.0,
            notes="Hasil optimal berkat perbaikan sistem naungan dan mikoriza.",
        ),
        # Farm 2 (Aek Sibontar)
        FinancialRecord(
            company_id=company.id,
            farm_id=farm2.id,
            period=period_prev2,
            total_production_kg=29000.0,
            operational_cost=148000000.0,
            estimated_revenue=232000000.0,
            notes="Perawatan rutin tumpang sari dan sanitasi kebun.",
        ),
        FinancialRecord(
            company_id=company.id,
            farm_id=farm2.id,
            period=period_prev1,
            total_production_kg=34200.0,
            operational_cost=142000000.0,
            estimated_revenue=275000000.0,
            notes="Peningkatan mutu ceri petik merah di atas 95%.",
        ),
        FinancialRecord(
            company_id=company.id,
            farm_id=farm2.id,
            period=period_curr,
            total_production_kg=41000.0,
            operational_cost=134000000.0,
            estimated_revenue=330000000.0,
            notes="Lonjakan pendapatan ekspor batch washed specialty.",
        ),
        # Farm 3 (Kampar Sawit)
        FinancialRecord(
            company_id=company.id,
            farm_id=farm3.id,
            period=period_prev1,
            total_production_kg=215000.0,
            operational_cost=205000000.0,
            estimated_revenue=430000000.0,
            notes="Produksi tandan buah segar (TBS) stabil.",
        ),
        FinancialRecord(
            company_id=company.id,
            farm_id=farm3.id,
            period=period_curr,
            total_production_kg=248000.0,
            operational_cost=194000000.0,
            estimated_revenue=496000000.0,
            notes="Efisiensi pemupukan presisi berbasis indeks vegetasi satelit.",
        ),
    ]
    db.session.add_all(fin_records)

    harvests = [
        HarvestRecord(
            company_id=company.id,
            farm_id=farm1.id,
            period=period_prev1,
            yield_kg=19500.0,
            area_harvested_ha=42.0,
            notes="Panen ceri kopi arabika matang pohon penuh.",
        ),
        HarvestRecord(
            company_id=company.id,
            farm_id=farm1.id,
            period=period_curr,
            yield_kg=23400.0,
            area_harvested_ha=43.5,
            notes="Produktivitas meningkat 20% dibandingkan periode sebelumnya.",
        ),
        HarvestRecord(
            company_id=company.id,
            farm_id=farm2.id,
            period=period_prev1,
            yield_kg=34200.0,
            area_harvested_ha=72.0,
            notes="Sortasi ceri dengan rasio floaters di bawah 2%.",
        ),
        HarvestRecord(
            company_id=company.id,
            farm_id=farm2.id,
            period=period_curr,
            yield_kg=41000.0,
            area_harvested_ha=76.0,
            notes="Panen puncak musim basah dengan kadar gula brix 21°.",
        ),
    ]
    db.session.add_all(harvests)

    esg_data = [
        EsgMetric(
            company_id=company.id,
            farm_id=farm1.id,
            period=period_prev1,
            carbon_footprint=14.2,
            water_usage=1250.0,
            biodiversity_index=4.2,
            social_compliance_score=91.0,
        ),
        EsgMetric(
            company_id=company.id,
            farm_id=farm1.id,
            period=period_curr,
            carbon_footprint=12.5,
            water_usage=1140.0,
            biodiversity_index=4.5,
            social_compliance_score=95.0,
        ),
        EsgMetric(
            company_id=company.id,
            farm_id=farm2.id,
            period=period_curr,
            carbon_footprint=11.8,
            water_usage=1200.0,
            biodiversity_index=4.6,
            social_compliance_score=94.5,
        ),
    ]
    db.session.add_all(esg_data)
    db.session.commit()
    print("[7/11] Data Keuangan, Panen, dan ESG metrik berhasil disimpan.")

    # -------------------------------------------------------------
    # 8. Agronomy Activities
    # -------------------------------------------------------------
    activities = [
        AgronomyActivity(
            farm_id=farm1.id,
            activity_type="Pemupukan Organik",
            quantity=350.0,
            unit="kg",
            notes="Aplikasi kompos kotoran kambing terfermentasi dan kulit kopi ke piringan tanaman.",
            activity_date=date(2026, 1, 15),
            created_by=manager.id,
        ),
        AgronomyActivity(
            farm_id=farm1.id,
            activity_type="Pemangkasan Naungan",
            quantity=42.0,
            unit="Ha",
            notes="Pengurangan kanopi pohon gamal untuk menjaga intensitas cahaya matahari 65-70%.",
            activity_date=date(2026, 1, 28),
            created_by=manager.id,
        ),
        AgronomyActivity(
            farm_id=farm1.id,
            activity_type="Pengendalian Hama Terpadu",
            quantity=150.0,
            unit="unit",
            notes="Pemasangan perangkap feromon Brocap untuk menekan populasi penggerek buah kopi (PBKo).",
            activity_date=date(2026, 2, 10),
            created_by=manager.id,
        ),
        AgronomyActivity(
            farm_id=farm2.id,
            activity_type="Pengukuran Sensor IoT",
            quantity=12.0,
            unit="titik",
            notes="Kalibrasi probe sensor kelembaban dan konduktivitas listrik (EC) tanah pada blok B.",
            activity_date=date(2026, 2, 18),
            created_by=manager.id,
        ),
        AgronomyActivity(
            farm_id=farm2.id,
            activity_type="Konservasi Terasering & Rorak",
            quantity=800.0,
            unit="meter",
            notes="Pembersihan dan sedimentasi rorak penahan erosi lereng terjal.",
            activity_date=date(2026, 3, 2),
            created_by=manager.id,
        ),
    ]
    db.session.add_all(activities)
    db.session.commit()
    print("[8/11] Catatan aktivitas agronomi lapangan berhasil disimpan.")

    # -------------------------------------------------------------
    # 9. Traceability Templates, Batches, Checkpoints, & QR Codes
    # -------------------------------------------------------------
    template = TraceTemplate(
        company_id=company.id,
        name="Standar Single Origin Kopi Mandailing (Full Wash)",
        description="SOP lengkap rantai ketertelusuran dari panen ceri hingga pengemasan vakum specialty.",
        is_active=True,
    )
    db.session.add(template)
    db.session.commit()

    steps = [
        TraceTemplateStep(
            template_id=template.id,
            step_order=1,
            name="Panen Ceri Merah Selektif",
            description="Pemetikan ceri kopi dengan tingkat kematangan optimal (brix min 20°).",
            required_photo=True,
            required_location=True,
            required_notes=True,
        ),
        TraceTemplateStep(
            template_id=template.id,
            step_order=2,
            name="Pulping & Fermentasi Basah",
            description="Pengupasan kulit buah dan fermentasi aerobik dalam tangki terkontrol selama 36 jam.",
            required_photo=True,
            required_notes=True,
        ),
        TraceTemplateStep(
            template_id=template.id,
            step_order=3,
            name="Pencucian & Pengeringan Solar Dome",
            description="Pencucian lendir hingga bersih dan penjemuran di atas raised bed hingga kadar air 11.5%.",
            required_photo=True,
            required_location=False,
            required_notes=True,
        ),
        TraceTemplateStep(
            template_id=template.id,
            step_order=4,
            name="Hulling & Sortasi Biji Hijau (Green Beans)",
            description="Pengupasan kulit tanduk, sortasi densitas gravitasi, dan triase manual biji cacat.",
            required_photo=True,
            required_notes=True,
        ),
        TraceTemplateStep(
            template_id=template.id,
            step_order=5,
            name="Roasting Profil Medium & Pengemasan Vakum",
            description="Penyangraian profile roast artisan dan pengemasan kedap udara one-way degassing valve.",
            required_photo=True,
            required_location=True,
            required_notes=True,
        ),
    ]
    db.session.add_all(steps)
    db.session.commit()

    # Batch 1: Completed Batch
    batch1 = Batch(
        company_id=company.id,
        farm_id=farm1.id,
        template_id=template.id,
        batch_number="BATCH-KOP-2026-001",
        product_name="Kopi Mandailing Lestari Arabika Typica 250g",
        harvest_date=date(2026, 1, 12),
        status="completed",
        completed_at=datetime(2026, 2, 8, 14, 0),
    )
    # Batch 2: In-Progress Batch
    batch2 = Batch(
        company_id=company.id,
        farm_id=farm2.id,
        template_id=template.id,
        batch_number="BATCH-KOP-2026-002",
        product_name="Kopi Mandailing Sigarar Utang Specialty 200g",
        harvest_date=date(2026, 2, 20),
        status="in_progress",
        completed_at=None,
    )
    db.session.add_all([batch1, batch2])
    db.session.commit()

    # Checkpoints for Batch 1 (Semua 5 Tahap Selesai)
    base_loc = "SRID=4326;POINT(99.5532 0.8467)"
    cp_notes = [
        "1.250 kg ceri merah dipanen dari blok barat, rata-rata brix 21.2°.",
        "Proses pulping lancar, pH akhir fermentasi 4.2.",
        "Penjemuran selesai dalam 14 hari di solar dryer dome, kadar air 11.2%.",
        "Grade 1 specialty defect < 3%, ukuran screen 16-18.",
        "Batch roasting profile agtron 58, dikemas vakum box nitrogen.",
    ]
    checkpoints_batch1 = []
    for idx, st in enumerate(steps):
        t_offset = timedelta(days=idx * 6, hours=idx * 2)
        checkpoints_batch1.append(
            BatchCheckpoint(
                batch_id=batch1.id,
                step_id=st.id,
                completed_by=manager.id,
                status="completed",
                photo_url="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
                notes=cp_notes[idx],
                location=base_loc,
                completed_at=datetime(2026, 1, 13) + t_offset,
            )
        )
    db.session.add_all(checkpoints_batch1)

    # Checkpoints for Batch 2 (Tahap 1-3 Selesai, Tahap 4-5 Pending)
    checkpoints_batch2 = [
        BatchCheckpoint(
            batch_id=batch2.id,
            step_id=steps[0].id,
            completed_by=manager.id,
            status="completed",
            photo_url="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
            notes="Panen 2.100 kg ceri merah Sigarar Utang.",
            location="SRID=4326;POINT(99.5645 0.8512)",
            completed_at=datetime(2026, 2, 21, 10, 0),
        ),
        BatchCheckpoint(
            batch_id=batch2.id,
            step_id=steps[1].id,
            completed_by=manager.id,
            status="completed",
            photo_url="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
            notes="Fermentasi basah berlangsung terkontrol selama 36 jam.",
            location="SRID=4326;POINT(99.5645 0.8512)",
            completed_at=datetime(2026, 2, 23, 11, 0),
        ),
        BatchCheckpoint(
            batch_id=batch2.id,
            step_id=steps[2].id,
            completed_by=manager.id,
            status="completed",
            photo_url="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
            notes="Sedang dalam proses penjemuran solar dome hari ke-8.",
            location="SRID=4326;POINT(99.5645 0.8512)",
            completed_at=datetime(2026, 3, 2, 15, 30),
        ),
        BatchCheckpoint(
            batch_id=batch2.id,
            step_id=steps[3].id,
            completed_by=None,
            status="pending",
            notes="Menunggu pengeringan mencapai standar kadar air.",
        ),
        BatchCheckpoint(
            batch_id=batch2.id,
            step_id=steps[4].id,
            completed_by=None,
            status="pending",
            notes="Jadwal sangrai batch berikutnya.",
        ),
    ]
    db.session.add_all(checkpoints_batch2)

    # QR Codes
    qr1 = QrCode(
        batch_id=batch1.id,
        qr_image_url="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=BATCH-KOP-2026-001",
        public_url=f"/trace/{batch1.batch_number}",
        scan_count=186,
        is_active=True,
    )
    qr2 = QrCode(
        batch_id=batch2.id,
        qr_image_url="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=BATCH-KOP-2026-002",
        public_url=f"/trace/{batch2.batch_number}",
        scan_count=42,
        is_active=True,
    )
    db.session.add_all([qr1, qr2])
    db.session.commit()
    print("[9/11] Template ketertelusuran, 2 Batch produksi, Checkpoint, dan QR Code berhasil dibuat.")

    # -------------------------------------------------------------
    # 10. Traceability Assessment & Perhitungan Otomatis SDG
    # -------------------------------------------------------------
    print("[10/11] Mengisi asesmen kuesioner dan menghitung hasil kontribusi SDG...")
    questionnaire = Questionnaire.query.filter_by(is_active=True).first()
    if questionnaire:
        assessment = TraceAssessment(
            project_traceability_id=trace_profile.id,
            questionnaire_id=questionnaire.id,
            assessor_id=manager.id,
            assessor_name="Tim Evaluasi Keberlanjutan Mandiri",
            respondent_id=manager.id,
            status="completed",
            started_at=datetime(2026, 1, 10, 8, 30),
            completed_at=datetime(2026, 1, 10, 16, 45),
            assessed_at=datetime(2026, 1, 10, 16, 45),
            notes="Asesmen awal tahun 2026: Pembuktian penerapan praktik agroforestri berkelanjutan dan kepatuhan standar ketenagakerjaan.",
            evidence_url="https://example.com/audit_kuesioner_sdg_2026.pdf",
        )
        db.session.add(assessment)
        db.session.commit()

        # Jawab semua pertanyaan questionnaire dengan opsi skor tinggi (75 atau 100)
        answers_to_add = []
        for q in questionnaire.questions:
            if not q.is_active or not q.options:
                continue
            # Pilih opsi dengan skor tertinggi (skor 100 atau 75)
            sorted_opts = sorted(q.options, key=lambda o: float(o.score), reverse=True)
            chosen_opt = sorted_opts[0] if sorted_opts else None
            if chosen_opt:
                answers_to_add.append(
                    AssessmentAnswer(
                        assessment_id=assessment.id,
                        question_id=q.id,
                        selected_option_id=chosen_opt.id,
                        answer_text=chosen_opt.option_text,
                        score=chosen_opt.score,
                        answered_at=datetime(2026, 1, 10, 11, 0),
                    )
                )
        db.session.add_all(answers_to_add)
        db.session.commit()

        # Jalankan engine penghitungan SDG resmi
        _calculate_sdg(assessment)
        db.session.commit()

        # Tandai SDG yang FULFILLED ke tabel ProjectSdg
        results = AssessmentSdgResult.query.filter_by(assessment_id=assessment.id).all()
        fulfilled_count = 0
        for r in results:
            if r.status == "FULFILLED" or float(r.score) >= 70.0:
                # Cek belum ada
                exists = ProjectSdg.query.filter_by(
                    project_traceability_id=trace_profile.id, sdg_id=r.sdg_id
                ).first()
                if not exists:
                    db.session.add(
                        ProjectSdg(
                            project_traceability_id=trace_profile.id,
                            assessment_sdg_result_id=r.id,
                            sdg_id=r.sdg_id,
                        )
                    )
                    fulfilled_count += 1
        db.session.commit()

        # Verifikasi SDG Proyek
        db.session.add(
            ProjectSdgVerification(
                project_traceability_id=trace_profile.id,
                assessed_by="PT Sucofindo (Persero)",
                evidence_file_url="https://example.com/sertifikasi_kopi_mandailing_sdg.pdf",
                evidence_file_type="pdf",
                assessment_date=datetime(2026, 1, 15),
            )
        )
        db.session.commit()
        print(f"       -> Asesmen selesai: {len(answers_to_add)} jawaban, {len(results)} SDG dihitung, {fulfilled_count} SDG terpenuhi (ProjectSdg).")
    else:
        print("       -> [SKIP] Questionnaire master belum tersedia.")

    # -------------------------------------------------------------
    # 11. Document Reports, Recent Activities & Activity Logs
    # -------------------------------------------------------------
    doc_reports = [
        DocumentReport(
            company_id=company.id,
            farm_id=None,
            title="Laporan Operasional Komprehensif Semester II 2025",
            report_type="comprehensive",
            farm_name="Semua Lahan",
            period=period_prev1,
            format="pdf",
            status="available",
            file_url=None,
        ),
        DocumentReport(
            company_id=company.id,
            farm_id=farm1.id,
            title=f"Laporan Kesehatan Tanah & Keseimbangan Nutrisi NPK {period_label(period_curr)}",
            report_type="agronomy",
            farm_name=farm1.name,
            period=period_curr,
            format="pdf",
            status="available",
            file_url=None,
        ),
        DocumentReport(
            company_id=company.id,
            farm_id=farm1.id,
            title="Laporan Neraca Cadangan Karbon (SOC) & MRV Biomassa 2025",
            report_type="carbon",
            farm_name=farm1.name,
            period=period_prev1,
            format="pdf",
            status="available",
            file_url=None,
        ),
        DocumentReport(
            company_id=company.id,
            farm_id=None,
            title=f"Laporan Kinerja Keuangan & Pertumbuhan Produktivitas {period_label(period_curr)}",
            report_type="finance",
            farm_name="Semua Lahan",
            period=period_curr,
            format="pdf",
            status="available",
            file_url=None,
        ),
        DocumentReport(
            company_id=company.id,
            farm_id=None,
            title="Laporan Kemitraan Petani & Pemberdayaan Komunitas 2025",
            report_type="social",
            farm_name="Semua Lahan",
            period=period_prev1,
            format="pdf",
            status="available",
            file_url=None,
        ),
    ]
    db.session.add_all(doc_reports)

    recent = [
        RecentActivity(
            title="Pembaruan Sertifikasi Organik & Fair Trade",
            description="AgriCorp memperbarui audit kemitraan organik perkebunan kopi Mandailing Natal.",
            activity_date=date(2026, 2, 20),
            display_order=1,
        ),
        RecentActivity(
            title="Pengiriman Ekspor Perdana Batch 2026",
            description="Sebanyak 15 ton green bean specialty Kopi Mandailing Lestari diekspor ke pelabuhan Hamburg.",
            activity_date=date(2026, 2, 25),
            display_order=2,
        ),
        RecentActivity(
            title="Pemasangan Stasiun Cuaca IoT Baru",
            description="Instalasi sensor pemantau iklim mikro dan kelembaban tanah otomatis di Blok Dolok Martimbang.",
            activity_date=date(2026, 3, 5),
            display_order=3,
        ),
    ]
    db.session.add_all(recent)

    logs = [
        ActivityLog(
            user_id=manager.id,
            action="CREATE",
            entity_type="Farm",
            details=f"Menambahkan lahan baru '{farm1.name}' seluas {farm1.total_area_ha} Ha",
            created_at=now - timedelta(days=14),
        ),
        ActivityLog(
            user_id=manager.id,
            action="CREATE",
            entity_type="Batch",
            details="Membuat batch produksi baru BATCH-KOP-2026-001",
            created_at=now - timedelta(days=10),
        ),
        ActivityLog(
            user_id=manager.id,
            action="UPDATE",
            entity_type="BatchCheckpoint",
            details="Menyelesaikan tahapan Roasting & Pengemasan Vakum untuk BATCH-KOP-2026-001",
            created_at=now - timedelta(days=4),
        ),
        ActivityLog(
            user_id=investor.id,
            action="LOGIN",
            entity_type="User",
            details="Investor mengakses dashboard eksekutif dan memantau proyeksi keuangan",
            created_at=now - timedelta(hours=3),
        ),
    ]
    db.session.add_all(logs)
    db.session.commit()
    print("[11/11] Dokumen laporan, aktivitas terkini, dan log audit berhasil disimpan.")


def upload_sdg_logos_to_minio():
    use_minio = os.getenv("USE_MINIO", "false").lower() == "true"
    if not use_minio:
        return

    try:
        import boto3
        from botocore.client import Config
    except ImportError:
        return

    endpoint = os.getenv("MINIO_INTERNAL_ENDPOINT") or os.getenv(
        "MINIO_ENDPOINT", "http://localhost:9000"
    )
    access_key = os.getenv("MINIO_ACCESS_KEY", "admin_utama")
    secret_key = os.getenv("MINIO_SECRET_KEY", "password_sangat_kuat_32karakter")
    bucket_name = os.getenv("MINIO_BUCKET_NAME", "agrivision-uploads")
    subfolder = "sdg-logos"
    logo_dir = os.path.join(os.path.dirname(__file__), "static", "uploads", "sdg-logos")

    client = boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(signature_version="s3v4", connect_timeout=5, read_timeout=10),
        region_name="us-east-1",
    )

    try:
        client.head_bucket(Bucket=bucket_name)
    except Exception:
        try:
            client.create_bucket(Bucket=bucket_name)
        except Exception:
            pass

    success = 0
    for goal_number in range(1, 18):
        filename = f"{goal_number}.png"
        filepath = os.path.join(logo_dir, filename)
        if not os.path.isfile(filepath):
            continue

        object_name = f"{subfolder}/{filename}"
        public_url = f"{endpoint}/{bucket_name}/{object_name}"

        master = SdgMaster.query.filter_by(goal_number=goal_number).first()
        if master and master.image_url and "localhost:9000" in str(master.image_url):
            continue

        try:
            with open(filepath, "rb") as f:
                client.upload_fileobj(
                    f,
                    bucket_name,
                    object_name,
                    ExtraArgs={"ContentType": "image/png"},
                )
            SdgMaster.query.filter_by(goal_number=goal_number).update(
                {"image_url": public_url}
            )
            Sdg.query.filter_by(code=str(goal_number)).update({"image_url": public_url})
            success += 1
        except Exception as e:
            print(f"[MinIO] Gagal upload logo SDG {goal_number}: {e}")

    db.session.commit()
    if success > 0:
        print(f"[MinIO] {success} Logo SDG berhasil diunggah ke MinIO.")


if __name__ == "__main__":
    with app.app_context():
        print("==========================================================")
        print("    MEMULAI SEED LENGKAP SISTEM AGRIVISION (seed_2.py)    ")
        print("==========================================================")

        # 1. Inisialisasi katalog SDG (Sdg & SdgMaster + Kuesioner)
        seed_sdg_catalog()
        seed_super_admin()

        from seed_sdg_contribution import run as seed_sdg_contribution_run

        seed_sdg_contribution_run()

        # 2. Bersihkan dan bangun data komprehensif
        clear_existing_data()
        run_complete_seed()

        # 3. Sinkronkan logo SDG ke MinIO jika aktif
        upload_sdg_logos_to_minio()

        print("==========================================================")
        print("           SEED LENGKAP BERHASIL DILAKUKAN!               ")
        print("==========================================================")
