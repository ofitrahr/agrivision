import React, { useEffect, useState } from 'react';
import api from '../../shared/api/axios';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../shared/components/UI/StatCard';
import InputNumber from '../../shared/components/UI/InputNumber';

const ManagerEconomics = () => {
  const navigate = useNavigate();
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const [records, setRecords] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [recordType, setRecordType] = useState('finance');

  const [period, setPeriod] = useState('');
  const [production, setProduction] = useState('');
  const [cost, setCost] = useState('');
  const [revenue, setRevenue] = useState('');
  const [notes, setNotes] = useState('');
  const [savingFinance, setSavingFinance] = useState(false);

  const [analyticsPeriod, setAnalyticsPeriod] = useState('');
  const [analyticsYield, setAnalyticsYield] = useState('');
  const [analyticsNotes, setAnalyticsNotes] = useState('');
  const [savingHarvest, setSavingHarvest] = useState(false);

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState(['comprehensive']);
  const [reportFarm, setReportFarm] = useState(['all']);
  const [reportPeriod, setReportPeriod] = useState('current_month');
  const [reportFormat, setReportFormat] = useState('pdf');

  const [recentReports, setRecentReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [observationSummary, setObservationSummary] = useState(null);

  useEffect(() => {
    fetchFarms();
    fetchReports();
  }, []);

  const fetchFarms = async () => {
    try {
      const response = await api.get('/manager/farms');
      if (response.data.success) {
        setFarms(response.data.data);
        if (response.data.data.length > 0 && !selectedFarm) {
          setSelectedFarm(String(response.data.data[0].id));
        }
      }
    } catch (error) {
      console.error('Gagal memuat daftar lahan', error);
    }
  };

  const fetchFinanceRecords = async (farmId) => {
    try {
      const response = await api.get(`/manager/farms/${farmId}/financials`);
      if (response.data.success) {
        setRecords(response.data.data);
      }
    } catch (error) {
      console.error('Gagal memuat catatan keuangan', error);
    }
  };

  const fetchAnalyticsData = async (farmId) => {
    try {
      const harvestsRes = await api.get(`/manager/farms/${farmId}/harvests`);
      if (harvestsRes.data.success) {
        setHarvests(harvestsRes.data.data);
      }
    } catch (error) {
      console.error('Gagal memuat data panen', error);
    }
  };

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const response = await api.get('/manager/reports');
      if (response.data.success) {
        setRecentReports(response.data.data);
      }
    } catch (error) {
      console.error('Gagal memuat daftar laporan', error);
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchObservationSummary = async (farmId) => {
    try {
      const response = await api.get(`/manager/farms/${farmId}/observation-summary`);
      if (response.data.success) {
        setObservationSummary(response.data.data);
      }
    } catch (error) {
      console.error('Gagal memuat ringkasan observasi', error);
      setObservationSummary(null);
    }
  };

  useEffect(() => {
    if (selectedFarm) {
      fetchFinanceRecords(selectedFarm);
      fetchAnalyticsData(selectedFarm);
      fetchObservationSummary(selectedFarm);
    }
  }, [selectedFarm]);

  const handleFinanceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFarm) return alert('Pilih lahan terlebih dahulu.');

    setSavingFinance(true);
    try {
      const payload = {
        period,
        total_production_kg: parseFloat(production) || 0,
        operational_cost: parseFloat(cost) || 0,
        estimated_revenue: parseFloat(revenue) || 0,
        notes,
      };
      const response = await api.post(`/manager/farms/${selectedFarm}/financials`, payload);
      if (response.data.success) {
        alert('Data keuangan berhasil disimpan!');
        setPeriod('');
        setProduction('');
        setCost('');
        setRevenue('');
        setNotes('');
        fetchFinanceRecords(selectedFarm);
      }
    } catch (error) {
      alert('Gagal menyimpan data keuangan.');
    } finally {
      setSavingFinance(false);
    }
  };

  const handleHarvestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFarm) return alert('Pilih lahan terlebih dahulu.');

    setSavingHarvest(true);
    try {
      const payload = {
        period: analyticsPeriod,
        yield_kg: parseFloat(analyticsYield) || 0,
        notes: analyticsNotes,
      };
      const response = await api.post(`/manager/farms/${selectedFarm}/harvests`, payload);
      if (response.data.success) {
        alert('Data panen berhasil disimpan!');
        setAnalyticsPeriod('');
        setAnalyticsYield('');
        setAnalyticsNotes('');
        fetchAnalyticsData(selectedFarm);
      }
    } catch (error) {
      alert('Gagal menyimpan data panen.');
    } finally {
      setSavingHarvest(false);
    }
  };

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setGenerating(true);

    const typeNames = {
      comprehensive: 'Laporan Lengkap Komprehensif',
      agronomy: 'Laporan Indeks Observasi & Kesehatan Tanaman',
      carbon: 'Laporan Neraca Karbon & MRV',
      finance: 'Laporan Produktivitas & Finansial Panen',
      traceability: 'Laporan Traceability & Keterlacakan',
    };

    const isAllFarms = reportFarm.includes('all') || reportFarm.length === 0;
    const targetFarmName = isAllFarms
      ? 'Semua Lahan'
      : reportFarm.map(id => farms.find((f) => String(f.id) === String(id))?.name).filter(Boolean).join(', ');

    const now = new Date();
    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const currentMonth = monthNames[now.getMonth()];
    const currentYear = now.getFullYear();
    const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);

    const periodNames = {
      current_month: `${currentMonth} ${currentYear}`,
      current_quarter: `Kuartal ${currentQuarter === 1 ? 'I' : currentQuarter === 2 ? 'II' : currentQuarter === 3 ? 'III' : 'IV'} ${currentYear}`,
      year_to_date: `Tahun ${currentYear} (YTD)`,
    };

    try {
      const payload = {
        title: reportType.length > 1 ? 'Laporan Gabungan Multi-Metrik' : (typeNames[reportType[0]] || 'Laporan Operasional Baru'),
        report_type: reportType.join(','),
        farm_id: isAllFarms ? null : reportFarm.join(','),
        farm_name: targetFarmName,
        period: periodNames[reportPeriod] || `${currentMonth} ${currentYear}`,
        format: reportFormat,
      };

      const response = await api.post('/manager/reports', payload);
      if (response.data.success) {
        setRecentReports((prev) => [response.data.data, ...prev]);
        setShowGenerateModal(false);
        alert(`Berhasil membuat dokumen: ${response.data.data.title} (${response.data.data.format})`);
      }
    } catch (error) {
      alert('Gagal membuat laporan.');
      console.error('Error generate report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (report) => {
    alert(`Mengunduh dokumen: ${report.title} [${report.format}]`);
  };

  const currentFarmObj = farms.find((f) => String(f.id) === String(selectedFarm));
  const currentAreaHa = parseFloat(currentFarmObj?.total_area_ha) || 1;
  const totalHarvestKg = harvests.reduce((sum, h) => sum + (parseFloat(h.yield_kg) || 0), 0);
  const productivityTonPerHa = observationSummary?.productivity ?? (totalHarvestKg > 0 ? (totalHarvestKg / 1000 / currentAreaHa).toFixed(2) : null);

  const socCarbon = observationSummary?.soc_carbon;
  const agbBiomass = observationSummary?.agb_biomass;
  const plantHealth = observationSummary?.plant_health;
  const soilNutrition = observationSummary?.soil_nutrition;

  const peningkatanPendapatan = observationSummary?.peningkatan_pendapatan || '-';
  const penghematanBiaya = observationSummary?.penghematan_biaya || '-';
  const estimasiPendapatanCarbon = observationSummary?.estimasi_pendapatan_carbon || '-';
  
  const nValue = observationSummary?.n_value || '-';
  const pValue = observationSummary?.p_value || '-';
  const kValue = observationSummary?.k_value || '-';

  const petaniTerberdayakan = observationSummary?.petani_terberdayakan || '-';
  const sebaranGender = observationSummary?.sebaran_gender || '-';
  const sebaranUsia = observationSummary?.sebaran_usia || '-';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Laporan dan Analitik</h1>
          <p className="page-subtitle">
            Ringkasan kesimpulan indeks observasi, dokumen laporan berkala, dan pencatatan operasional.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowGenerateModal(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          Generate Laporan
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--color-border-muted)', paddingBottom: '2px' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              color: activeTab === 'overview' ? 'var(--color-primary-container)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'overview' ? '3px solid var(--color-primary-container)' : '3px solid transparent',
              marginBottom: '-2px',
              transition: 'all var(--transition)',
            }}
          >
            Ikhtisar & Riwayat Laporan
          </button>
          <button
            onClick={() => setActiveTab('records')}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              color: activeTab === 'records' ? 'var(--color-primary-container)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'records' ? '3px solid var(--color-primary-container)' : '3px solid transparent',
              marginBottom: '-2px',
              transition: 'all var(--transition)',
            }}
          >
            Pencatatan Operasional
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-main)' }}>
            Lahan Terpilih:
          </label>
          <select
            className="form-input"
            value={selectedFarm}
            onChange={(e) => setSelectedFarm(e.target.value)}
            style={{ width: 'auto', minWidth: '220px', padding: '6px 12px', fontSize: '13px' }}
          >
            {farms.map((f) => (
              <option key={f.id} value={f.id}>{f.name} ({f.total_area_ha} Ha)</option>
            ))}
          </select>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section aria-label="Kesimpulan Index Observasi">
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-main)', margin: 0 }}>
                Kesimpulan Index Observasi
              </h2>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary-container)' }}>payments</span>
                Ekonomi
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <StatCard
                  title="Produktivitas Tanaman"
                  headerUnit="(ton/ha)"
                  value={productivityTonPerHa !== null ? `${productivityTonPerHa}` : '-'}
                  icon="eco"
                />
                <StatCard
                  title="Peningkatan Pendapatan"
                  headerUnit="(%)"
                  value={peningkatanPendapatan}
                  icon="trending_up"
                />
                <StatCard
                  title="Penghematan Biaya Produksi"
                  headerUnit="(%)"
                  value={penghematanBiaya}
                  icon="savings"
                />
                <StatCard
                  title="Estimasi Pendapatan Carbon"
                  headerUnit="(IDR)"
                  value={estimasiPendapatanCarbon}
                  icon="payments"
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary-container)' }}>eco</span>
                Ekologi
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <StatCard
                  title="Kesehatan Tanaman"
                  headerUnit="(% Sehat)"
                  value={plantHealth !== null ? `${plantHealth}` : '-'}
                  icon="vital_signs"
                />
                <StatCard
                  title="Nutrisi Tanaman"
                  value={
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '14px', fontWeight: 600, border: '1px solid var(--color-border-muted)', background: 'var(--color-surface-container-low)', color: 'var(--color-text-main)' }}>
                        N: {nValue}
                      </span>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '14px', fontWeight: 600, border: '1px solid var(--color-border-muted)', background: 'var(--color-surface-container-low)', color: 'var(--color-text-main)' }}>
                        P: {pValue}
                      </span>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '14px', fontWeight: 600, border: '1px solid var(--color-border-muted)', background: 'var(--color-surface-container-low)', color: 'var(--color-text-main)' }}>
                        K: {kValue}
                      </span>
                    </div>
                  }
                  icon="science"
                />
                <StatCard
                  title="Penyerapan Karbon Tanah"
                  headerUnit="(ton CO2e)"
                  value={socCarbon !== null ? socCarbon : '-'}
                  icon="co2"
                />
                <StatCard
                  title="Biomassa Karbon"
                  headerUnit="(ton CO2e)"
                  value={agbBiomass !== null ? agbBiomass : '-'}
                  icon="park"
                />
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary-container)' }}>groups</span>
                Sosial
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <StatCard
                  title="Petani Terberdayakan"
                  headerUnit="(Orang)"
                  value={petaniTerberdayakan}
                  icon="groups"
                />
                <StatCard
                  title="Sebaran Gender"
                  value={sebaranGender}
                  icon="wc"
                />
                <StatCard
                  title="Sebaran Usia"
                  value={sebaranUsia}
                  icon="cake"
                />
              </div>
            </div>
          </section>

          <div className="agro-card" style={{ padding: '24px' }}>
            <h2 className="agro-card-title" style={{ fontSize: '18px', marginBottom: '16px' }}>
              Recent Reports (Dokumen Terkini)
            </h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nama Dokumen Laporan</th>
                    <th>Tipe Laporan</th>
                    <th>Lahan</th>
                    <th>Periode</th>
                    <th>Format</th>
                    <th>Tanggal Dibuat</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {reportsLoading ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                        Memuat daftar laporan...
                      </td>
                    </tr>
                  ) : recentReports.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                        Belum ada laporan yang dibuat. Klik "Generate Laporan" untuk membuat laporan baru.
                      </td>
                    </tr>
                  ) : (
                    recentReports.map((rep) => (
                    <tr key={rep.id}>
                      <td style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary-container)' }}>
                            description
                          </span>
                          {rep.title}
                        </div>
                      </td>
                      <td>
                        <span className="agro-chip" style={{ fontSize: '11px', padding: '3px 8px' }}>
                          {rep.type}
                        </span>
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{rep.farmName}</td>
                      <td style={{ fontSize: '13px' }}>{rep.period}</td>
                      <td>
                        <span className="badge badge-stable" style={{ fontSize: '11px' }}>{rep.format}</span>
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{rep.date}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 10px' }}
                          onClick={() => handleDownload(rep)}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                          Unduh
                        </button>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'records' && (
        <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 'var(--gutter)', alignItems: 'start' }}>
          <div className="agro-card" style={{ padding: '24px' }}>
            <h2 className="agro-card-title" style={{ fontSize: '18px', marginBottom: '16px' }}>
              Input Catatan Operasional
            </h2>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button
                type="button"
                className={`btn btn-sm ${recordType === 'finance' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setRecordType('finance')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>payments</span>
                Catatan Keuangan
              </button>
              <button
                type="button"
                className={`btn btn-sm ${recordType === 'harvest' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setRecordType('harvest')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>agriculture</span>
                Hasil Panen
              </button>
            </div>

            {recordType === 'finance' ? (
              <form onSubmit={handleFinanceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label">Periode Waktu *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Contoh: Agustus 2026"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Total Produksi (Kg)</label>
                  <InputNumber
                    min="0"
                    className="form-input"
                    placeholder="0"
                    value={production}
                    onChange={(e) => setProduction(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Total Pendapatan (Rp)</label>
                  <InputNumber
                    min="0"
                    className="form-input"
                    placeholder="0"
                    value={revenue}
                    onChange={(e) => setRevenue(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Biaya Operasional (Rp)</label>
                  <InputNumber
                    min="0"
                    className="form-input"
                    placeholder="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Catatan Tambahan</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="Keterangan alokasi biaya atau komoditas"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={savingFinance} style={{ marginTop: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
                  {savingFinance ? 'Menyimpan...' : 'Simpan Catatan Keuangan'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleHarvestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label">Periode Panen *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Contoh: Agustus 2026"
                    value={analyticsPeriod}
                    onChange={(e) => setAnalyticsPeriod(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Hasil Panen (Kg) *</label>
                  <InputNumber
                    min="0"
                    required
                    className="form-input"
                    placeholder="0"
                    value={analyticsYield}
                    onChange={(e) => setAnalyticsYield(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Catatan Kualitas & Kendala</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="Kualitas grade biji kopi, kadar air, dll."
                    value={analyticsNotes}
                    onChange={(e) => setAnalyticsNotes(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={savingHarvest} style={{ marginTop: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
                  {savingHarvest ? 'Menyimpan...' : 'Simpan Data Panen'}
                </button>
              </form>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="agro-card" style={{ padding: '24px' }}>
              <h2 className="agro-card-title" style={{ fontSize: '18px', marginBottom: '16px' }}>
                Riwayat Catatan Keuangan
              </h2>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Periode</th>
                      <th>Produksi (Kg)</th>
                      <th>Pendapatan</th>
                      <th>Biaya</th>
                      <th>Laba Bersih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                          Belum ada catatan keuangan untuk lahan ini.
                        </td>
                      </tr>
                    ) : (
                      records.map((r) => (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 600 }}>{r.period}</td>
                          <td>{Number(r.total_production_kg).toLocaleString('id-ID')}</td>
                          <td style={{ color: 'var(--color-main-green)', fontWeight: 600 }}>
                            Rp {Number(r.estimated_revenue).toLocaleString('id-ID')}
                          </td>
                          <td style={{ color: 'var(--color-error)' }}>
                            Rp {Number(r.operational_cost).toLocaleString('id-ID')}
                          </td>
                          <td style={{ fontWeight: 700, color: Number(r.profit) >= 0 ? 'var(--color-text-main)' : 'var(--color-error)' }}>
                            Rp {Number(r.profit).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="agro-card" style={{ padding: '24px' }}>
              <h2 className="agro-card-title" style={{ fontSize: '18px', marginBottom: '16px' }}>
                Log Data Panen Masuk
              </h2>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Periode</th>
                      <th>Hasil Panen</th>
                      <th>Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {harvests.length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                          Belum ada data panen tercatat untuk lahan ini.
                        </td>
                      </tr>
                    ) : (
                      harvests.map((h) => (
                        <tr key={h.id}>
                          <td style={{ fontWeight: 600 }}>{h.period}</td>
                          <td style={{ color: 'var(--color-main-green)', fontWeight: 600 }}>
                            {Number(h.yield_kg).toLocaleString('id-ID')} Kg
                          </td>
                          <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{h.notes || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGenerateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--color-primary-container)' }}>
                  description
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--color-text-main)' }}>
                  Generate Dokumen Laporan
                </h2>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowGenerateModal(false)}
                style={{ padding: '4px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
              </button>
            </div>

            <form onSubmit={handleGenerateReport} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Jenis Laporan *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { id: 'comprehensive', title: 'Laporan Lengkap Komprehensif', desc: 'Mencakup seluruh metrik agronomi, neraca karbon, dan finansial.' },
                    { id: 'agronomy', title: 'Laporan Observasi & Kesehatan Tanaman', desc: 'Indeks vegetasi (NDVI) dan nutrisi tanah NPK.' },
                    { id: 'carbon', title: 'Laporan Neraca Karbon & MRV', desc: 'Penyerapan karbon tanah (SOC) dan biomassa.' },
                    { id: 'finance', title: 'Laporan Produktivitas & Keuangan', desc: 'Hasil panen, biaya operasional, dan laba/rugi.' },
                    { id: 'traceability', title: 'Laporan Traceability & Keterlacakan', desc: 'Data jejak asal usul komoditas dan petani.' },
                  ].map((opt) => {
                    const isSelected = reportType.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          if (opt.id === 'comprehensive') {
                            setReportType(isSelected ? [] : ['comprehensive']);
                          } else {
                            setReportType(prev => {
                              const newPrev = prev.filter(t => t !== 'comprehensive');
                              return isSelected ? newPrev.filter(t => t !== opt.id) : [...newPrev, opt.id];
                            });
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${isSelected ? 'var(--color-primary-container)' : 'var(--color-border-muted)'}`,
                          background: isSelected ? 'var(--color-surface-container-low)' : 'var(--color-surface-white)',
                          cursor: 'pointer',
                          transition: 'all var(--transition)',
                        }}
                      >
                        {isSelected ? (
                          <span className="material-symbols-outlined" style={{ color: 'var(--color-main-green)', fontSize: '22px', fontVariationSettings: '"FILL" 1' }}>
                            check_circle
                          </span>
                        ) : (
                          <span className="material-symbols-outlined" style={{ color: 'var(--color-border-muted)', fontSize: '22px' }}>
                            radio_button_unchecked
                          </span>
                        )}
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-main)' }}>{opt.title}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{opt.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Cakupan Lahan</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[{ id: 'all', name: 'Semua Lahan Proyek' }, ...farms].map((f) => {
                    const isSelected = reportFarm.includes(f.id);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          if (f.id === 'all') {
                            setReportFarm(['all']);
                          } else {
                            setReportFarm(prev => {
                              const newPrev = prev.filter(v => v !== 'all');
                              if (prev.includes(f.id)) {
                                return newPrev.filter(v => v !== f.id);
                              } else {
                                return [...newPrev, f.id];
                              }
                            });
                          }
                        }}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          background: isSelected ? 'var(--color-main-green)' : 'var(--color-surface-white)',
                          color: isSelected ? '#fff' : 'var(--color-text-main)',
                          border: isSelected ? '1px solid var(--color-main-green)' : '1px solid var(--color-border-muted)',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {isSelected && (
                          <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: '"FILL" 1' }}>
                            check_circle
                          </span>
                        )}
                        {f.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Rentang Periode</label>
                  <select
                    className="form-input"
                    value={reportPeriod}
                    onChange={(e) => setReportPeriod(e.target.value)}
                  >
                    {(() => {
                      const now = new Date();
                      const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
                      const m = monthNames[now.getMonth()];
                      const y = now.getFullYear();
                      const q = Math.ceil((now.getMonth() + 1) / 3);
                      return (
                        <>
                          <option value="current_month">{`Bulan Ini (${m} ${y})`}</option>
                          <option value="current_quarter">{`Kuartal Ini (Q${q} ${y})`}</option>
                          <option value="year_to_date">{`Tahun ${y} (YTD)`}</option>
                        </>
                      );
                    })()}
                  </select>
                </div>
                <div>
                  <label className="form-label">Format Dokumen</label>
                  <select
                    className="form-input"
                    value={reportFormat}
                    onChange={(e) => setReportFormat(e.target.value)}
                  >
                    <option value="pdf">Dokumen PDF (.pdf)</option>
                    <option value="xlsx">Spreadsheet Excel (.xlsx)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--color-border-muted)' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowGenerateModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={generating}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                  {generating ? 'Memproses...' : 'Generate & Unduh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerEconomics;
