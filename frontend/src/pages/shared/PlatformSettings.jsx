import React, { useState } from 'react';
import { getStoredSettings } from '../../shared/utils/settingsHelper';
import { Globe, BarChart2, Bell, Lock } from 'lucide-react';

const PlatformSettings = () => {
    const [activeTab, setActiveTab] = useState('units');
    const [settings, setSettings] = useState(() => ({
        ...getStoredSettings(),
        carbonUnit: 'Ton C',
        currency: 'IDR (Rp)'
    }));
    const [savedSuccess, setSavedSuccess] = useState(false);

    const handleChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSave = () => {
        try {
            localStorage.setItem('agrivision_settings', JSON.stringify(settings));
            window.dispatchEvent(new Event('settingsUpdated'));
            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 3000);
        } catch (e) {
            console.error("Gagal menyimpan preferensi", e);
        }
    };

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '60px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#012d1d', margin: '0 0 6px 0' }}>
                    Settings
                </h1>
                <p style={{ fontSize: '13px', color: '#5c716a', margin: 0 }}>
                    Atur preferensi aplikasi dan notifikasi kamu.
                </p>
            </div>

            {/* Banner Sukses */}
            {savedSuccess && (
                <div style={{
                    padding: '12px 18px',
                    borderRadius: '8px',
                    background: '#e6f4eb',
                    border: '1px solid #116a3a',
                    color: '#012d1d',
                    marginBottom: '20px',
                    fontWeight: 600,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#116a3a' }}>check_circle</span>
                    <span>Preferensi berhasil disimpan dan diterapkan.</span>
                </div>
            )}

            {/* Layout 2-Kolom Sesuai Gambar Target */}
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', alignItems: 'start' }}>
                
                {/* Kiri: Sidebar Tab Preferences */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    padding: '20px 0',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}>
                    <div style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        color: '#94a3b8',
                        padding: '0 20px 12px 20px',
                        textTransform: 'uppercase'
                    }}>
                        PREFERENCES
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* Tab Notifications */}
                        <div 
                            onClick={() => setActiveTab('notifications')}
                            style={{
                                padding: '12px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                fontSize: '14px',
                                fontWeight: activeTab === 'notifications' ? 600 : 500,
                                color: activeTab === 'notifications' ? '#012d1d' : '#64748b',
                                background: activeTab === 'notifications' ? '#e6f4eb' : 'transparent',
                                borderLeft: activeTab === 'notifications' ? '3px solid #116a3a' : '3px solid transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <Bell size={18} color={activeTab === 'notifications' ? '#116a3a' : '#64748b'} />
                            Notifications
                        </div>

                        {/* Tab Units & Language */}
                        <div 
                            onClick={() => setActiveTab('units')}
                            style={{
                                padding: '12px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                fontSize: '14px',
                                fontWeight: activeTab === 'units' ? 600 : 500,
                                color: activeTab === 'units' ? '#012d1d' : '#64748b',
                                background: activeTab === 'units' ? '#e6f4eb' : 'transparent',
                                borderLeft: activeTab === 'units' ? '3px solid #116a3a' : '3px solid transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <Globe size={18} color={activeTab === 'units' ? '#116a3a' : '#64748b'} />
                            Units & Language
                        </div>

                        {/* Tab Data & Display */}
                        <div 
                            onClick={() => setActiveTab('display')}
                            style={{
                                padding: '12px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                fontSize: '14px',
                                fontWeight: activeTab === 'display' ? 600 : 500,
                                color: activeTab === 'display' ? '#012d1d' : '#64748b',
                                background: activeTab === 'display' ? '#e6f4eb' : 'transparent',
                                borderLeft: activeTab === 'display' ? '3px solid #116a3a' : '3px solid transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <BarChart2 size={18} color={activeTab === 'display' ? '#116a3a' : '#64748b'} />
                            Data & Display
                        </div>

                        {/* Tab Privacy & Data */}
                        <div 
                            onClick={() => setActiveTab('privacy')}
                            style={{
                                padding: '12px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                fontSize: '14px',
                                fontWeight: activeTab === 'privacy' ? 600 : 500,
                                color: activeTab === 'privacy' ? '#012d1d' : '#64748b',
                                background: activeTab === 'privacy' ? '#e6f4eb' : 'transparent',
                                borderLeft: activeTab === 'privacy' ? '3px solid #116a3a' : '3px solid transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <Lock size={18} color={activeTab === 'privacy' ? '#116a3a' : '#64748b'} />
                            Privacy & Data
                        </div>
                    </div>
                </div>

                {/* Kanan: Content Kartu Utama Sesuai Gambar Target */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    padding: '32px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}>
                    
                    {/* TAB UNITS & LANGUAGE */}
                    {activeTab === 'units' && (
                        <div>
                            <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#012d1d', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                    UNITS & LANGUAGE
                                </h2>
                                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                                    Selesaikan satuan dan bahasa tampilan aplikasi.
                                </p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {/* Bahasa */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#012d1d' }}>Bahasa</div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Pilih bahasa antarmuka aplikasi</div>
                                    </div>
                                    <select 
                                        style={{
                                            width: '200px',
                                            padding: '9px 12px',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            color: '#012d1d',
                                            background: '#ffffff',
                                            cursor: 'pointer'
                                        }}
                                        value={settings.language}
                                        onChange={(e) => handleChange('language', e.target.value)}
                                    >
                                        <option value="id">Indonesia</option>
                                        <option value="en">English (US)</option>
                                    </select>
                                </div>

                                {/* Satuan Area */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#012d1d' }}>Satuan Area</div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Satuan luas lahan yang ditampilkan</div>
                                    </div>
                                    <select 
                                        style={{
                                            width: '200px',
                                            padding: '9px 12px',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            color: '#012d1d',
                                            background: '#ffffff',
                                            cursor: 'pointer'
                                        }}
                                        value={settings.areaUnit}
                                        onChange={(e) => handleChange('areaUnit', e.target.value)}
                                    >
                                        <option value="ha">Ha (Hektar)</option>
                                        <option value="m2">m² (Meter Persegi)</option>
                                    </select>
                                </div>

                                {/* Satuan Karbon */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#012d1d' }}>Satuan Karbon</div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Satuan untuk data stok karbon</div>
                                    </div>
                                    <select 
                                        style={{
                                            width: '200px',
                                            padding: '9px 12px',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            color: '#012d1d',
                                            background: '#ffffff',
                                            cursor: 'pointer'
                                        }}
                                        value={settings.carbonUnit || 'Ton C'}
                                        onChange={(e) => handleChange('carbonUnit', e.target.value)}
                                    >
                                        <option value="Ton C">Ton C</option>
                                        <option value="Kg C">Kg C</option>
                                    </select>
                                </div>

                                {/* Format Tanggal */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#012d1d' }}>Format Tanggal</div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Format tampilan tanggal di seluruh aplikasi</div>
                                    </div>
                                    <select 
                                        style={{
                                            width: '200px',
                                            padding: '9px 12px',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            color: '#012d1d',
                                            background: '#ffffff',
                                            cursor: 'pointer'
                                        }}
                                        value={settings.dateFormat}
                                        onChange={(e) => handleChange('dateFormat', e.target.value)}
                                    >
                                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                        <option value="DD MMM YYYY">DD MMM YYYY</option>
                                    </select>
                                </div>

                                {/* Mata Uang */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#012d1d' }}>Mata Uang</div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Satuan mata uang untuk estimasi nilai klaim</div>
                                    </div>
                                    <select 
                                        style={{
                                            width: '200px',
                                            padding: '9px 12px',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '13px',
                                            fontWeight: 500,
                                            color: '#012d1d',
                                            background: '#ffffff',
                                            cursor: 'pointer'
                                        }}
                                        value={settings.currency || 'IDR (Rp)'}
                                        onChange={(e) => handleChange('currency', e.target.value)}
                                    >
                                        <option value="IDR (Rp)">IDR (Rp)</option>
                                        <option value="USD ($)">USD ($)</option>
                                    </select>
                                </div>

                                {/* Ambang Batas Peringatan NDVI */}
                                <div style={{ padding: '20px 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#012d1d' }}>
                                            Ambang Batas Peringatan NDVI
                                        </div>
                                        <div style={{
                                            padding: '4px 12px',
                                            borderRadius: '6px',
                                            background: '#e6f4eb',
                                            color: '#116a3a',
                                            fontWeight: 700,
                                            fontSize: '14px'
                                        }}>
                                            {settings.ndviThreshold}
                                        </div>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0.10" 
                                        max="0.90" 
                                        step="0.05"
                                        value={settings.ndviThreshold}
                                        onChange={(e) => handleChange('ndviThreshold', parseFloat(e.target.value))}
                                        style={{
                                            width: '100%',
                                            accentColor: '#116a3a',
                                            cursor: 'pointer',
                                            height: '24px',
                                            margin: '6px 0',
                                            display: 'block',
                                            outline: 'none',
                                            border: 'none',
                                            boxShadow: 'none'
                                        }}
                                    />
                                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px' }}>
                                        Nilai kesehatan tanaman di bawah angka ini akan ditandai sebagai indikasi stres vegetasi pada modul agronomi.
                                    </div>
                                </div>
                            </div>

                            {/* Tombol Simpan Preferences */}
                            <div style={{ marginTop: '28px' }}>
                                <button 
                                    onClick={handleSave}
                                    style={{
                                        padding: '12px 24px',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        borderRadius: '8px',
                                        background: '#012d1d',
                                        color: '#ffffff',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    Save Preferences
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB DATA & DISPLAY */}
                    {activeTab === 'display' && (
                        <div>
                            <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#012d1d', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                    DATA & DISPLAY
                                </h2>
                                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                                    Pengaturan zona waktu dan opsi tampilan data operasional.
                                </p>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', borderBottom: '1px solid #f1f5f9' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#012d1d' }}>Zona Waktu Lahan</div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Zona waktu operasional pengelola lahan</div>
                                </div>
                                <select 
                                    style={{
                                        width: '200px',
                                        padding: '9px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: '#012d1d',
                                        background: '#ffffff',
                                        cursor: 'pointer'
                                    }}
                                    value={settings.timezone}
                                    onChange={(e) => handleChange('timezone', e.target.value)}
                                >
                                    <option value="WIB">WIB (UTC+7)</option>
                                    <option value="WITA">WITA (UTC+8)</option>
                                    <option value="WIT">WIT (UTC+9)</option>
                                </select>
                            </div>

                            <div style={{ marginTop: '28px' }}>
                                <button 
                                    onClick={handleSave}
                                    style={{
                                        padding: '12px 24px',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        borderRadius: '8px',
                                        background: '#012d1d',
                                        color: '#ffffff',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Save Preferences
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB NOTIFICATIONS & PRIVACY */}
                    {(activeTab === 'notifications' || activeTab === 'privacy') && (
                        <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#cbd5e1', marginBottom: '12px' }}>build</span>
                            <div style={{ fontSize: '15px', fontWeight: 600, color: '#012d1d' }}>Modul Pengaturan Ini Sedang Disiapkan</div>
                            <div style={{ fontSize: '13px', marginTop: '4px' }}>Silakan gunakan tab <b>Units & Language</b> untuk mengonfigurasi preferensi saat ini.</div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default PlatformSettings;
