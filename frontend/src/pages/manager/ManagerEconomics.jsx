import React, { useEffect, useState, useMemo } from 'react';
import api from '../../shared/api/axios';
import { useNavigate } from 'react-router-dom';
import InputNumber from '../../shared/components/UI/InputNumber';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const getCurrentMonthIndonesian = () => {
  const d = new Date();
  return `${MONTH_NAMES_ID[d.getMonth()]} ${d.getFullYear()}`;
};

const formatYearMonthToIndonesian = (yyyyMm) => {
  if (!yyyyMm || typeof yyyyMm !== 'string') return yyyyMm || '';
  if (!yyyyMm.includes('-')) return yyyyMm;
  const [yearStr, monthStr] = yyyyMm.split('-');
  const monthIdx = parseInt(monthStr, 10) - 1;
  if (monthIdx >= 0 && monthIdx < 12) {
    return `${MONTH_NAMES_ID[monthIdx]} ${yearStr}`;
  }
  return yyyyMm;
};

// Komponen Kalender Pemilih Bulan & Tahun Interaktif (Non-input string)
const MonthYearPicker = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef(null);

  const currentYear = new Date().getFullYear();
  const [navYear, setNavYear] = useState(() => {
    if (value) {
      const match = value.match(/\d{4}/);
      if (match) return parseInt(match[0], 10);
    }
    return currentYear;
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  let selectedMonth = '';
  let selectedYear = null;
  if (value) {
    const parts = value.split(' ');
    if (parts.length === 2) {
      selectedMonth = parts[0];
      selectedYear = parseInt(parts[1], 10);
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <label className="form-label">{label}</label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="form-input"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
          background: 'var(--color-surface-white)'
        }}
      >
        <span style={{ color: value ? 'var(--color-text-main)' : 'var(--color-text-muted)', fontWeight: value ? 600 : 400 }}>
          {value || 'Pilih Bulan & Tahun'}
        </span>
        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-main-green)' }}>
          calendar_month
        </span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          zIndex: 50,
          background: 'var(--color-surface-white)',
          border: '1px solid var(--color-border-muted)',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          padding: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ padding: '4px 8px', height: 'auto', minHeight: 'unset' }}
              onClick={(e) => {
                e.stopPropagation();
                setNavYear((prev) => prev - 1);
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
            </button>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-main)' }}>
              {navYear}
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ padding: '4px 8px', height: 'auto', minHeight: 'unset' }}
              onClick={(e) => {
                e.stopPropagation();
                setNavYear((prev) => prev + 1);
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {MONTH_NAMES_ID.map((m) => {
              const isSelected = selectedMonth === m && selectedYear === navYear;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(`${m} ${navYear}`);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '6px',
                    border: isSelected ? '1px solid var(--color-main-green)' : '1px solid var(--color-border-muted)',
                    background: isSelected ? 'var(--color-main-green)' : 'var(--color-surface-container-low)',
                    color: isSelected ? '#ffffff' : 'var(--color-text-main)',
                    fontSize: '11px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    textAlign: 'center'
                  }}
                >
                  {m.substring(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const ManagerEconomics = () => {
  const navigate = useNavigate();
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'records'

  // Operational records states
  const [records, setRecords] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [recordType, setRecordType] = useState('finance'); // 'finance' | 'harvest'

  // Finance form states
  const [period, setPeriod] = useState(getCurrentMonthIndonesian());
  const [production, setProduction] = useState('');
  const [cost, setCost] = useState('');
  const [revenue, setRevenue] = useState('');
  const [notes, setNotes] = useState('');
  const [savingFinance, setSavingFinance] = useState(false);

  // Harvest form states
  const [analyticsPeriod, setAnalyticsPeriod] = useState(getCurrentMonthIndonesian());
  const [analyticsYield, setAnalyticsYield] = useState('');
  const [analyticsNotes, setAnalyticsNotes] = useState('');
  const [savingHarvest, setSavingHarvest] = useState(false);

  // Generate Report Modal states
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState(['comprehensive']);
  const [reportFarm, setReportFarm] = useState(['all']);
  const [reportPeriod, setReportPeriod] = useState('current_month');
  const [reportFormat, setReportFormat] = useState('pdf');

  // Reports data states
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
      const formattedPeriod = formatYearMonthToIndonesian(period) || period;
      const payload = {
        period: formattedPeriod,
        total_production_kg: parseFloat(production) || 0,
        operational_cost: parseFloat(cost) || 0,
        estimated_revenue: parseFloat(revenue) || 0,
        notes,
      };
      const response = await api.post(`/manager/farms/${selectedFarm}/financials`, payload);
      if (response.data.success) {
        alert('Data keuangan berhasil disimpan!');
        setPeriod(getCurrentMonthIndonesian());
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
      const formattedPeriod = formatYearMonthToIndonesian(analyticsPeriod) || analyticsPeriod;
      const payload = {
        period: formattedPeriod,
        yield_kg: parseFloat(analyticsYield) || 0,
        notes: analyticsNotes,
      };
      const response = await api.post(`/manager/farms/${selectedFarm}/harvests`, payload);
      if (response.data.success) {
        alert('Data panen berhasil disimpan!');
        setAnalyticsPeriod(getCurrentMonthIndonesian());
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
      agronomy: 'Laporan Kesehatan Tanah & Nutrisi',
      carbon: 'Laporan Neraca Karbon & MRV',
      finance: 'Laporan Produktivitas & Finansial Panen',
      traceability: 'Laporan Traceability & Keterlacakan',
      social: 'Laporan Sosial & Pemberdayaan',
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
        // Otomatis unduh file yang baru saja di-generate
        handleDownload(response.data.data);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Gagal membuat laporan.';
      alert(`Gagal membuat laporan: ${msg}`);
      console.error('Error generate report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (report) => {
    const token = localStorage.getItem('token'); 
    
    fetch(`${api.defaults.baseURL || 'http://localhost:5000/api'}/manager/reports/${report.id}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) throw new Error('Gagal mengunduh');
      return response.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileExt = (report.format || 'pdf').toLowerCase();
      a.download = `${(report.title || 'Laporan').replace(/\s+/g, '_')}.${fileExt}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    })
    .catch(err => {
      console.error(err);
      alert('Terjadi kesalahan saat mengunduh dokumen.');
    });
  };

  // Metrik Lahan & Observasi
  const currentFarmObj = farms.find((f) => String(f.id) === String(selectedFarm));
  const currentAreaHa = parseFloat(currentFarmObj?.total_area_ha) || 4.3;
  const totalHarvestKg = harvests.reduce((sum, h) => sum + (parseFloat(h.yield_kg) || 0), 0);
  const productivityTonPerHa = observationSummary?.productivity ?? (totalHarvestKg > 0 ? (totalHarvestKg / 1000 / currentAreaHa).toFixed(2) : '3.03');

  const socCarbon = observationSummary?.soc_carbon || '57.8';
  const agbBiomass = observationSummary?.agb_biomass || '230';
  const plantHealth = observationSummary?.plant_health || '80';

  const estimasiPendapatan = records.length > 0 
    ? Number(records[0].estimated_revenue).toLocaleString('id-ID')
    : '8.670.000';
  
  const estimasiPendapatanCarbon = observationSummary?.estimasi_pendapatan_carbon || '8.670.000';
  
  const nValue = observationSummary?.n_value ? String(observationSummary.n_value).replace(/[^\d.]/g, '') : '46.9';
  const pValue = observationSummary?.p_value ? String(observationSummary.p_value).replace(/[^\d.]/g, '') : '46.8';
  const kValue = observationSummary?.k_value ? String(observationSummary.k_value).replace(/[^\d.]/g, '') : '46.4';

  const petaniTerberdayakan = observationSummary?.petani_terberdayakan || '2';
  const totalLahanTerdaftar = farms.length > 0 ? farms.length : '2';

  // Perhitungan Pertumbuhan Pendapatan Dinamis
  const peningkatanPendapatan = useMemo(() => {
    if (observationSummary?.peningkatan_pendapatan && observationSummary.peningkatan_pendapatan !== '-') {
      let val = String(observationSummary.peningkatan_pendapatan);
      if (val === '-0.0' || val === '-0.0%') val = '+0.0';
      return val.endsWith('%') ? val : `${val}%`;
    }
    if (records.length >= 2) {
      const current = Number(records[0].estimated_revenue) || 0;
      const previous = Number(records[1].estimated_revenue) || 0;
      if (previous > 0) {
        let pct = ((current - previous) / previous) * 100;
        if (Math.abs(pct) < 0.05) pct = 0;
        return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
      }
    }
    return '-';
  }, [observationSummary, records]);

  // Perhitungan Penghematan Biaya Dinamis
  const penghematanBiaya = useMemo(() => {
    if (observationSummary?.penghematan_biaya && observationSummary.penghematan_biaya !== '-') {
      let val = String(observationSummary.penghematan_biaya);
      if (val === '-0.0' || val === '-0.0%') val = '+0.0';
      return val.endsWith('%') ? val : `${val}%`;
    }
    if (records.length >= 2) {
      const current = Number(records[0].operational_cost) || 0;
      const previous = Number(records[1].operational_cost) || 0;
      if (previous > 0) {
        let pct = ((previous - current) / previous) * 100;
        if (Math.abs(pct) < 0.05) pct = 0;
        return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
      }
    }
    return '-';
  }, [observationSummary, records]);

  // Data Donut Chart Sebaran Gender Dinamis
  const genderChartData = useMemo(() => {
    let male = 0;
    let female = 0;
    if (observationSummary?.sebaran_gender && observationSummary.sebaran_gender !== '-') {
      const parts = observationSummary.sebaran_gender.split('/');
      parts.forEach((p) => {
        const trimmed = p.trim().toLowerCase();
        if (trimmed.includes('l')) male = parseInt(trimmed) || 0;
        if (trimmed.includes('p')) female = parseInt(trimmed) || 0;
      });
    }
    if (male === 0 && female === 0) {
      return [
        { name: 'Laki-laki', value: 1, color: '#053b26' },
        { name: 'Perempuan', value: 1, color: '#f59e0b' },
      ];
    }
    return [
      { name: 'Laki-laki', value: male, color: '#053b26' },
      { name: 'Perempuan', value: female, color: '#f59e0b' },
    ];
  }, [observationSummary]);

  // Data Donut Chart Sebaran Usia Dinamis
  const ageChartData = useMemo(() => {
    let muda = 0;
    let dewasa = 0;
    let tua = 0;
    if (observationSummary?.sebaran_usia && observationSummary.sebaran_usia !== '-') {
      const parts = observationSummary.sebaran_usia.split('|');
      parts.forEach((p) => {
        const [label, countStr] = p.split(':').map((s) => s.trim());
        const count = parseInt(countStr) || 0;
        if (label && countStr) {
          if (label.includes('<30')) muda = count;
          else if (label.includes('30-50')) dewasa = count;
          else if (label.includes('>50')) tua = count;
        }
      });
    }
    const total = muda + dewasa + tua;
    if (total === 0) {
      return [{ name: '30-50', value: 2, color: '#053b26' }];
    }
    const items = [];
    if (muda > 0) items.push({ name: '<30', value: muda, color: '#10b981' });
    if (dewasa > 0) items.push({ name: '30-50', value: dewasa, color: '#053b26' });
    if (tua > 0) items.push({ name: '>50', value: tua, color: '#f59e0b' });
    return items;
  }, [observationSummary]);

  const sebaranGenderText = useMemo(() => {
    if (observationSummary?.sebaran_gender && observationSummary.sebaran_gender !== '-') {
      return observationSummary.sebaran_gender;
    }
    const male = genderChartData.find((g) => g.name === 'Laki-laki')?.value || 0;
    const female = genderChartData.find((g) => g.name === 'Perempuan')?.value || 0;
    return `${male} Laki / ${female} Pr`;
  }, [observationSummary, genderChartData]);

  const sebaranUsiaText = useMemo(() => {
    if (observationSummary?.sebaran_usia && observationSummary.sebaran_usia !== '-') {
      return observationSummary.sebaran_usia;
    }
    return '30-50th: 2 Orang';
  }, [observationSummary]);

  const displayedReports = recentReports;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Laporan dan Analitik</h1>
          <p className="page-subtitle">
            Ringkasan kesimpulan indeks observasi, dokumen laporan berkala, dan pencatatan operasional lahan.
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

      {/* --- TOP BAR: TABS & FARM SELECTOR --- */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--color-border-muted)',
        paddingBottom: '2px',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', gap: '28px' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '10px 0',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              color: activeTab === 'overview' ? 'var(--color-primary-container)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'overview' ? '2.5px solid var(--color-primary-container)' : '2.5px solid transparent',
              marginBottom: '-2px',
              transition: 'all var(--transition)',
            }}
          >
            Ikhtisar & Riwayat Laporan
          </button>
          <button
            onClick={() => setActiveTab('records')}
            style={{
              padding: '10px 0',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              color: activeTab === 'records' ? 'var(--color-primary-container)' : 'var(--color-text-muted)',
              borderBottom: activeTab === 'records' ? '2.5px solid var(--color-primary-container)' : '2.5px solid transparent',
              marginBottom: '-2px',
              transition: 'all var(--transition)',
            }}
          >
            Pencatatan Operasional
          </button>
        </div>

        {/* Lahan Terpilih Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--color-text-main)'
        }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Lahan Terpilih:</span>
          <div style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            background: 'var(--color-surface-white)',
            border: '1px solid var(--color-border-muted)',
            borderRadius: '8px',
            padding: '6px 12px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}>
            <select
              value={selectedFarm}
              onChange={(e) => setSelectedFarm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--color-text-main)',
                cursor: 'pointer',
                paddingRight: '24px',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
              }}
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id} style={{ background: '#fff', color: 'var(--color-text-main)' }}>
                  {f.name} ({f.total_area_ha} Ha)
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined" style={{
              position: 'absolute',
              right: '8px',
              fontSize: '18px',
              color: 'var(--color-text-muted)',
              pointerEvents: 'none'
            }}>
              expand_more
            </span>
          </div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Section: Kesimpulan Index Observasi (3 Kolom Executive Summary) */}
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '16px' }}>
              Kesimpulan Index Observasi
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
            }}>

              {/* KOLOM 1: EKONOMI */}
              <div style={{
                background: 'var(--color-surface-white)',
                borderRadius: '12px',
                padding: '20px 24px',
                border: '1px solid var(--color-border-muted)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '18px',
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(5, 59, 38, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-main-green)',
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>payments</span>
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                      Kinerja Ekonomi
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-muted)', paddingBottom: '10px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Produktivitas (Ton/Ha)</span>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-main)' }}>{productivityTonPerHa}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-muted)', paddingBottom: '10px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Peningkatan Pendapatan</span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-main-green)' }}>{peningkatanPendapatan}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-muted)', paddingBottom: '10px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Penghematan Biaya</span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-main-green)' }}>{penghematanBiaya}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '2px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Estimasi Karbon (IDR)</span>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-main)' }}>Rp {estimasiPendapatanCarbon}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* KOLOM 2: EKOLOGI */}
              <div style={{
                background: 'var(--color-surface-white)',
                borderRadius: '12px',
                padding: '20px 24px',
                border: '1px solid var(--color-border-muted)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '18px',
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(5, 59, 38, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-main-green)',
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>eco</span>
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                      Dampak Ekologi
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-muted)', paddingBottom: '10px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Kesehatan Tanaman</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-main)' }}>{plantHealth}%</span>
                        <span className={`badge ${Number(plantHealth) >= 50 ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                          {Number(plantHealth) >= 50 ? 'Sehat' : 'Perhatian'}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-muted)', paddingBottom: '10px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Serapan Karbon Tanah</span>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-main)' }}>{socCarbon} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)' }}>ton CO2e</span></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-muted)', paddingBottom: '10px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Biomassa Karbon</span>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-main)' }}>{agbBiomass} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-muted)' }}>ton CO2e</span></span>
                    </div>
                    
                    {/* Bagian Nutrisi (NPK) Dipisah */}
                    <div style={{ paddingTop: '2px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
                        Nutrisi Tanah (NPK)
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        <div style={{
                          background: 'var(--color-surface-container-low)',
                          borderRadius: '8px',
                          padding: '8px 6px',
                          border: '1px solid var(--color-border-muted)',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Nitrogen (N)</div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-main)', marginTop: '2px' }}>{nValue} mg/kg</div>
                        </div>
                        <div style={{
                          background: 'var(--color-surface-container-low)',
                          borderRadius: '8px',
                          padding: '8px 6px',
                          border: '1px solid var(--color-border-muted)',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Fosfor (P)</div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-main)', marginTop: '2px' }}>{pValue} mg/kg</div>
                        </div>
                        <div style={{
                          background: 'var(--color-surface-container-low)',
                          borderRadius: '8px',
                          padding: '8px 6px',
                          border: '1px solid var(--color-border-muted)',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Kalium (K)</div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-main)', marginTop: '2px' }}>{kValue} mg/kg</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* KOLOM 3: SOSIAL */}
              <div style={{
                background: 'var(--color-surface-white)',
                borderRadius: '12px',
                padding: '20px 24px',
                border: '1px solid var(--color-border-muted)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '18px',
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(5, 59, 38, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-main-green)',
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>group</span>
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                      Profil Sosial
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Baris 1: Petani Terberdayakan */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-muted)', paddingBottom: '10px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500 }}>Petani Terberdayakan</span>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-main)' }}>{petaniTerberdayakan} Orang</span>
                    </div>

                    {/* Baris 2: 2 Kolom Sebaran Gender & Sebaran Usia */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                      {/* Kolom 1: Sebaran Gender */}
                      <div style={{
                        background: 'var(--color-surface-container-low)',
                        borderRadius: '8px',
                        padding: '10px 8px',
                        border: '1px solid var(--color-border-muted)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                          Sebaran Gender
                        </span>
                        <div style={{ width: 84, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <PieChart width={84} height={84}>
                            <Tooltip
                              formatter={(val, name) => [`${val} Orang`, name]}
                              contentStyle={{
                                background: 'var(--color-surface-white)',
                                border: '1px solid var(--color-border-muted)',
                                borderRadius: '6px',
                                fontSize: '11px',
                                padding: '4px 8px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                              }}
                              itemStyle={{ color: 'var(--color-text-main)', fontWeight: 600 }}
                            />
                            <Pie
                              data={genderChartData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={20}
                              outerRadius={36}
                              paddingAngle={3}
                              stroke="none"
                            >
                              {genderChartData.map((entry, index) => (
                                <Cell key={`gender-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px', width: '100%' }}>
                          {genderChartData.map((item, idx) => {
                            const totalGender = genderChartData.reduce((sum, g) => sum + g.value, 0);
                            const pct = totalGender > 0 ? Math.round((item.value / totalGender) * 100) : 0;
                            return (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: item.color, display: 'inline-block', flexShrink: 0 }} />
                                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {item.name === 'Laki-laki' ? 'Pria' : 'Wanita'}
                                  </span>
                                </div>
                                <span style={{ fontWeight: 700, color: 'var(--color-text-main)', marginLeft: '4px' }}>
                                  {item.value} ({pct}%)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Kolom 2: Sebaran Usia */}
                      <div style={{
                        background: 'var(--color-surface-container-low)',
                        borderRadius: '8px',
                        padding: '10px 8px',
                        border: '1px solid var(--color-border-muted)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                          Sebaran Usia
                        </span>
                        <div style={{ width: 84, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <PieChart width={84} height={84}>
                            <Tooltip
                              formatter={(val, name) => [`${val} Orang`, `${name} th`]}
                              contentStyle={{
                                background: 'var(--color-surface-white)',
                                border: '1px solid var(--color-border-muted)',
                                borderRadius: '6px',
                                fontSize: '11px',
                                padding: '4px 8px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                              }}
                              itemStyle={{ color: 'var(--color-text-main)', fontWeight: 600 }}
                            />
                            <Pie
                              data={ageChartData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={20}
                              outerRadius={36}
                              paddingAngle={3}
                              stroke="none"
                            >
                              {ageChartData.map((entry, index) => (
                                <Cell key={`age-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px', width: '100%' }}>
                          {ageChartData.map((item, idx) => {
                            const totalAge = ageChartData.reduce((sum, a) => sum + a.value, 0);
                            const pct = totalAge > 0 ? Math.round((item.value / totalAge) * 100) : 0;
                            return (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: item.color, display: 'inline-block', flexShrink: 0 }} />
                                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {item.name} th
                                  </span>
                                </div>
                                <span style={{ fontWeight: 700, color: 'var(--color-text-main)', marginLeft: '4px' }}>
                                  {item.value} ({pct}%)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>



          {/* --- 6. SECTION: LAPORAN TERKINI (TABLE) --- */}
          <div style={{
            background: 'var(--color-surface-white)',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid var(--color-border-muted)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-main-green)' }}>
                  description
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--color-text-main)' }}>
                  Recent Reports (Dokumen Terkini)
                </h3>
              </div>

              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowGenerateModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                Generate Laporan
              </button>
            </div>

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
                      <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-muted)' }}>
                        Memuat riwayat laporan...
                      </td>
                    </tr>
                  ) : displayedReports.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: 'rgba(5, 59, 38, 0.08)',
                          color: 'var(--color-main-green)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '10px'
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>description</span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>
                          Belum ada laporan yang dibuat. Klik "Generate Laporan" untuk membuat laporan baru.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedReports.map((rep) => (
                      <tr key={rep.id}>
                        <td style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-main-green)' }}>
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

      {/* --- TAB 2: PENCATATAN OPERASIONAL --- */}
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
                <MonthYearPicker
                  label="Periode Waktu *"
                  value={period}
                  onChange={setPeriod}
                />
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
                <MonthYearPicker
                  label="Periode Panen *"
                  value={analyticsPeriod}
                  onChange={setAnalyticsPeriod}
                />
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
                  <label className="form-label">Catatan Panen</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="Keterangan kondisi panen atau varietas"
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
                      <th>Biaya Operasional</th>
                      <th>Laba / Rugi</th>
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
                          <td style={{ fontWeight: 600 }}>{formatYearMonthToIndonesian(r.period)}</td>
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
                          <td style={{ fontWeight: 600 }}>{formatYearMonthToIndonesian(h.period)}</td>
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

      {/* --- MODAL: GENERATE DOKUMEN LAPORAN --- */}
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
                    { id: 'agronomy', title: 'Laporan Kesehatan Tanah & Nutrisi', desc: 'Analisis profil nutrisi tanah (NPK), pH, mikroklimat, dan kesehatan tanaman.' },
                    { id: 'carbon', title: 'Laporan Neraca Karbon & MRV', desc: 'Penyerapan karbon tanah (SOC) dan biomassa.' },
                    { id: 'finance', title: 'Laporan Produktivitas & Keuangan', desc: 'Hasil panen, biaya operasional, dan laba/rugi.' },
                    { id: 'traceability', title: 'Laporan Traceability & Keterlacakan', desc: 'Data jejak asal usul komoditas dan petani.' },
                    { id: 'social', title: 'Laporan Sosial & Pemberdayaan', desc: 'Sebaran demografi dan pemberdayaan petani.' },
                  ].map((opt) => {
                    const isSelected = reportType.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          if (opt.id === 'comprehensive') {
                            setReportType(isSelected ? [] : ['comprehensive']);
                          } else {
                            setReportType((prev) => {
                              const newPrev = prev.filter((t) => t !== 'comprehensive');
                              return isSelected ? newPrev.filter((t) => t !== opt.id) : [...newPrev, opt.id];
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
                            setReportFarm((prev) => {
                              const newPrev = prev.filter((v) => v !== 'all');
                              if (prev.includes(f.id)) {
                                return newPrev.filter((v) => v !== f.id);
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
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {generating ? 'Memproses...' : 'Render & Unduh Laporan'}
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
