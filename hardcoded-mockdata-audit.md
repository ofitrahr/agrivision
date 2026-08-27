# Hardcoded & Mock Data Audit

## Executive Summary

Ringkasan jumlah temuan hardcoded dan mock data pada project Agrivision:
- Critical: 0
- High: 2 (Manager Economics Recent Reports & Manager Economics Stats Fallback)
- Medium: 1 (Period Filters Hardcoded)
- Low: 1 (Landing Page Stats)
- Not an Issue: 3 (Landing Page CSS Mockup, Traceability Dashboard Public, Manager Traceability Metadata)

*Catatan: Sesuai instruksi terbaru, seluruh data dan file yang terkait dengan fitur Traceability secara eksplisit dipertahankan statis dan tidak diubah status maupun kodenya (diklasifikasikan sebagai Not an Issue).*

## Data Flow Overview

Alur data pada sistem secara umum:
```text
Database (PostgreSQL)
↓
Backend Models (SQLAlchemy: Farm, Project, EsgMetric, dll)
↓
Backend Service / Route (manager_routes, public_routes)
↓
API Endpoints (JSON)
↓
Frontend API Client (axios)
↓
React Components (Pages & Views)
↓
UI (Dashboard, Map, dll)
```

## Findings

### 1. Public Traceability Dashboard (MOCK_DATA)

**Lokasi:**
- File: `frontend/src/pages/public/TraceabilityDashboard.jsx`
- Path: `/public/traceability/:projectRef`
- Function/component: `TraceabilityDashboard`
- Line number: 5-43 (Deklarasi `MOCK_DATA`)

**Jenis:**
- Not an Issue

**Data yang ditemukan:**
```javascript
const MOCK_DATA = {
  batch_number: 'BATCH-2025-001',
  company_name: 'Kadatuan Coffee',
  // ...
};
```
Data dirender dari object konstan ini beserta simulasi loading dengan `setTimeout`.

**Digunakan oleh:**
Halaman Traceability Publik.

**Seharusnya berasal dari:**
- Sesuai instruksi khusus, data ini **tidak boleh diubah**. Sistem akan tetap menggunakan data mock/statis saat ini.

**Status data sebenarnya:**
Tidak perlu diubah.

---

### 2. Recent Reports (Dokumen Terkini)

**Lokasi:**
- File: `frontend/src/pages/manager/ManagerEconomics.jsx`
- Path: `/manager/economics`
- Function/component: `ManagerEconomics`
- Line number: 36-77

**Jenis:**
- Mock Data / High

**Data yang ditemukan:**
```javascript
const [recentReports, setRecentReports] = useState([
  {
    id: 'rep-01',
    title: 'Laporan Evaluasi Agronomi & Kesehatan Kanopi',
    type: 'Agronomi',
    farmName: 'Kebon Kopi Kadatuan',
    period: 'Agustus 2026',
    format: 'PDF',
    status: 'Tersedia',
    date: '2026-08-20',
  },
  // ...
]);
```
Saat manager mengklik "Generate Laporan", sistem juga hanya melakukan push objek baru ke array state tersebut dengan `setTimeout(..., 800)`.

**Digunakan oleh:**
Table "Recent Reports (Dokumen Terkini)" pada tab Ikhtisar di halaman Manager Economics.

**Seharusnya berasal dari:**
- Database PostgreSQL
- Model baru: `DocumentReport`
- API backend: `GET /api/manager/reports` dan `POST /api/manager/reports`

**Status data sebenarnya:**
Belum tersedia di database (belum ada model dan endpoint).

---

### 3. Economics Dashboard - Kesimpulan Index Observasi Fallback

**Lokasi:**
- File: `frontend/src/pages/manager/ManagerEconomics.jsx`
- Path: `/manager/economics`
- Function/component: `ManagerEconomics`
- Line number: 231-232, 318-347

**Jenis:**
- Hardcoded Data / High

**Data yang ditemukan:**
```javascript
const socCarbon = (currentAreaHa * 18.5).toFixed(1);
const agbBiomass = (currentAreaHa * 42.1).toFixed(1);
// Pada komponen StatCard
value={totalHarvestKg > 0 ? `${productivityTonPerHa}` : '3.8'}
value="88%" // Kesehatan Tanaman
value="76%" // Nutrisi Tanaman
```
Angka-angka ESG dan Agronomi di-hardcode dengan formula statis (`Area * 18.5`) atau persentase konstan (`88%`).

**Digunakan oleh:**
Kartu metrik (StatCard) pada tab Ikhtisar (Overview) di halaman Manager Economics.

**Seharusnya berasal dari:**
- API backend endpoint `/api/manager/farms/<farm_id>/agronomy-stats` (untuk layer NDVI/Kesehatan dan NPK/Nutrisi) dan endpoint `/api/manager/dashboard/stats` (EsgMetric untuk carbon).

**Status data sebenarnya:**
Sudah tersedia di API (via `GisLayer` dan `EsgMetric`) dan frontend `AgronomyDetailView` sudah bisa mengambilnya, tetapi UI ManagerEconomics belum mengintegrasikan pemanggilan API tersebut.

---

### 4. Manager Traceability - Metadata Profil Hardcoded

**Lokasi:**
- File: `frontend/src/pages/manager/ManagerTraceability.jsx`
- Path: `/manager/traceability`
- Function/component: `ManagerTraceability`
- Line number: 164, 177, 192

**Jenis:**
- Not an Issue

**Data yang ditemukan:**
Data pada "Core Metadata" section hanya berupa teks mentah:
```javascript
<div>Kadatuan Coffee</div>
<div>Coffee</div>
<div><MapPin size={18} /> Aceh Tengah</div>
```

**Digunakan oleh:**
Halaman form edit Traceability bagi Manager.

**Seharusnya berasal dari:**
- Sesuai instruksi khusus, data dan format komponen ini **tidak boleh diubah**.

**Status data sebenarnya:**
Tidak perlu diubah.

---

### 5. Period Filters (Rentang Waktu) Hardcoded

**Lokasi:**
- Frontend File: `frontend/src/pages/manager/agronomy/AgronomyDetailView.jsx` (Line 8) dan `ManagerEconomics.jsx` (Line 198)
- Backend File: `backend/app/api/routes/manager_routes.py` (Line 641)

**Jenis:**
- Static Configuration / Medium

**Data yang ditemukan:**
Frontend: `const PERIODS = [{ id: 'Q1_2025', label: 'Jan - Mar 2025' }, ...]`
Backend: `all_periods = ['Q1_2025', 'Q2_2025', 'Q3_2025', 'Q4_2025', 'Q1_2026']`

**Digunakan oleh:**
Dropdown filter periode pada peta agronomi dan laporan, serta saat agregasi tren lintas waktu di backend.

**Seharusnya berasal dari:**
Backend idealnya melakukan query dinamis `SELECT DISTINCT period FROM gis_layers` atau menyediakannya sebagai konfigurasi dinamis berdasarkan tanggal hari ini, lalu mengirimkan daftar `available_periods` ke frontend.

**Status data sebenarnya:**
Data record period tersedia di DB, namun daftar dropdown dan parameter grouping di-hardcode.

## Recommended Implementation Order

### Phase 1: Dynamic Frontend Integration (High Priority)
1. Perbaiki `ManagerEconomics.jsx` section "Kesimpulan Index Observasi". Panggil endpoint `GET /api/manager/farms/<farm_id>/agronomy-stats` untuk NDVI dan NPK, serta ambil data karbon dari `/api/manager/dashboard/stats` untuk menggantikan formula `18.5` dan hardcoded `88%`.

### Phase 2: Reporting Module & Period Configs
1. Buat model `DocumentReport` di `models.py`.
2. Buat endpoint CRUD `GET`, `POST` untuk `/api/manager/reports`.
3. Sambungkan fitur "Generate Laporan" dan list "Recent Reports" di `ManagerEconomics.jsx` ke API.
4. Jadikan array `PERIODS` dinamis berdasarkan data agregasi.

*(Bagian perbaikan Traceability dihapus karena instruksi meminta untuk tidak menyentuh komponen dan integrasi Traceability)*

## API Requirements

- **Belum tersedia:** `GET /api/manager/reports` & `POST /api/manager/reports`.
- **Sudah tersedia:** `GET /api/manager/farms/<farm_id>/agronomy-stats` (tinggal digunakan oleh Economics).

## Database Requirements

- **Belum tersedia:** Model `DocumentReport` (untuk menyimpan metadata laporan PDF/XLSX yang di-generate user).

## Frontend Requirements

- `ManagerEconomics.jsx`: Buang state hardcoded `recentReports`, panggil API. Gunakan data endpoint `agronomy-stats` untuk Card Stats (jangan gunakan `.toFixed` dari konstanta matematika).
- `AgronomyDetailView.jsx`: Gunakan API untuk load daftar `PERIODS` (jika sistem nantinya mendukung lebih dari 5 kuartal spesifik tersebut).

## Final Checklist

- [ ] Tidak ada mockdata production pada modul operasional/economics.
- [ ] Dashboard menggunakan data database.
- [ ] Chart menggunakan data API (✅ Sudah dinamis di Admin & Board).
- [ ] Map menggunakan data GIS yang sebenarnya (✅ Sudah dinamis dengan MapCanvas).
- [ ] User data berasal dari authentication/API.
- [ ] Loading state tersedia.
- [ ] Error handling tersedia.
- [ ] API dan database sudah terhubung.
- [x] **Pengecualian Khusus**: Data Traceability dipertahankan sebagai Mock/Statis.

## Tutorial Perbaikan

### Jika Data Belum Ada (Contoh: Laporan / Recent Reports)

1. Tentukan entity yang dibutuhkan: `DocumentReport`
2. Tentukan database model (di `models.py`):
```python
class DocumentReport(db.Model):
    __tablename__ = 'document_reports'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = db.Column(UUID(as_uuid=True), db.ForeignKey('farms.id'))
    title = db.Column(db.String(255), nullable=False)
    report_type = db.Column(db.String(50))
    period = db.Column(db.String(50))
    format = db.Column(db.String(10))
    file_url = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
```
3. Buat migration database.
4. Buat API endpoint di `manager_routes.py`:
```python
@manager_bp.route('/reports', methods=['GET', 'POST'])
def handle_reports(): ...
```
5. Hubungkan endpoint dengan frontend di `ManagerEconomics.jsx` via Axios dan hapus MOCK state. Tambahkan state loading.
