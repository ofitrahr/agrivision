import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, BarChart2, Bell, Lock, ShieldCheck, KeyRound, Database } from 'lucide-react';
import api from '../../shared/api/axios';
import i18n from '../../shared/utils/i18n';
import { DEFAULT_SETTINGS, getStoredSettings, storeSettings } from '../../shared/utils/settingsHelper';

const TABS = [
    { key: 'notifications', Icon: Bell },
    { key: 'units', Icon: Globe },
    { key: 'display', Icon: BarChart2 },
    { key: 'privacy', Icon: Lock },
];

const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '18px 0', borderBottom: '1px solid #f1f5f9' };
const labelStyle = { fontWeight: 600, fontSize: '14px', color: '#012d1d' };
const descStyle = { fontSize: '12px', color: '#94a3b8', marginTop: '2px' };
const selectStyle = {
    width: '200px',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    fontWeight: 500,
    color: '#012d1d',
    background: '#ffffff',
    cursor: 'pointer'
};

const SectionHeader = ({ title, desc }) => (
    <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#012d1d', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            {title}
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>{desc}</p>
    </div>
);

const SettingRow = ({ label, desc, children }) => (
    <div style={rowStyle}>
        <div>
            <div style={labelStyle}>{label}</div>
            <div style={descStyle}>{desc}</div>
        </div>
        {children}
    </div>
);

const ToggleRow = ({ label, desc, checked, onChange }) => (
    <SettingRow label={label} desc={desc}>
        <label className="agro-toggle-switch">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
            <span className="agro-toggle-slider" />
        </label>
    </SettingRow>
);

// Hanya key yang dikenal backend yang dikirim/disimpan
const pickKnownSettings = (source) =>
    Object.fromEntries(Object.keys(DEFAULT_SETTINGS).map(key => [key, source[key] ?? DEFAULT_SETTINGS[key]]));

const PlatformSettings = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('units');
    const [settings, setSettings] = useState(getStoredSettings);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // null | 'success' | 'local'
    const bannerTimer = useRef(null);

    // Ikuti perubahan dari luar halaman, misalnya sinkronisasi server saat login
    useEffect(() => {
        const handleUpdate = () => setSettings(getStoredSettings());
        window.addEventListener('settingsUpdated', handleUpdate);
        return () => {
            window.removeEventListener('settingsUpdated', handleUpdate);
            clearTimeout(bannerTimer.current);
        };
    }, []);

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const showBanner = (status) => {
        setSaveStatus(status);
        clearTimeout(bannerTimer.current);
        bannerTimer.current = setTimeout(() => setSaveStatus(null), 3000);
    };

    const handleSave = async () => {
        const payload = pickKnownSettings(settings);
        setSaving(true);

        // 1) Simpan lokal + dispatch 'settingsUpdated' agar UI langsung berubah, termasuk saat offline
        storeSettings(payload);
        i18n.changeLanguage(payload.language);

        // 2) Sinkron ke server
        try {
            const res = await api.put('/auth/settings', payload);
            const saved = res.data?.data;
            if (saved && typeof saved === 'object') {
                storeSettings({ ...DEFAULT_SETTINGS, ...saved });
            }
            showBanner('success');
        } catch (e) {
            console.error("Gagal sinkron preferensi ke server", e);
            showBanner('local');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '60px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#012d1d', margin: '0 0 6px 0' }}>
                    {t('settings.title')}
                </h1>
                <p style={{ fontSize: '13px', color: '#5c716a', margin: 0 }}>
                    {t('settings.subtitle')}
                </p>
            </div>

            {/* Banner hasil simpan */}
            {saveStatus && (
                <div role="status" style={{
                    padding: '12px 18px',
                    borderRadius: '8px',
                    background: saveStatus === 'success' ? '#e6f4eb' : '#fff8e1',
                    border: `1px solid ${saveStatus === 'success' ? '#116a3a' : '#f59e0b'}`,
                    color: '#012d1d',
                    marginBottom: '20px',
                    fontWeight: 600,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: saveStatus === 'success' ? '#116a3a' : '#b45309' }}>
                        {saveStatus === 'success' ? 'check_circle' : 'cloud_off'}
                    </span>
                    <span>{t(saveStatus === 'success' ? 'settings.savedSuccess' : 'settings.savedLocalOnly')}</span>
                </div>
            )}

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
                        {t('settings.preferences')}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {TABS.map(({ key, Icon }) => {
                            const isActive = activeTab === key;
                            return (
                                <div
                                    key={key}
                                    onClick={() => setActiveTab(key)}
                                    style={{
                                        padding: '12px 20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        fontSize: '14px',
                                        fontWeight: isActive ? 600 : 500,
                                        color: isActive ? '#012d1d' : '#64748b',
                                        background: isActive ? '#e6f4eb' : 'transparent',
                                        borderLeft: isActive ? '3px solid #116a3a' : '3px solid transparent',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <Icon size={18} color={isActive ? '#116a3a' : '#64748b'} />
                                    {t(`settings.tabs.${key}`)}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Kanan: Konten Tab */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    padding: '32px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}>

                    {/* TAB NOTIFICATIONS */}
                    {activeTab === 'notifications' && (
                        <div>
                            <SectionHeader title={t('settings.notifications.title')} desc={t('settings.notifications.desc')} />
                            <ToggleRow
                                label={t('settings.notifications.inApp')}
                                desc={t('settings.notifications.inAppDesc')}
                                checked={settings.notifInApp}
                                onChange={(v) => handleChange('notifInApp', v)}
                            />
                            <ToggleRow
                                label={t('settings.notifications.anomaly')}
                                desc={t('settings.notifications.anomalyDesc')}
                                checked={settings.notifAnomaly}
                                onChange={(v) => handleChange('notifAnomaly', v)}
                            />
                            <ToggleRow
                                label={t('settings.notifications.reports')}
                                desc={t('settings.notifications.reportsDesc')}
                                checked={settings.notifReports}
                                onChange={(v) => handleChange('notifReports', v)}
                            />
                            <ToggleRow
                                label={t('settings.notifications.system')}
                                desc={t('settings.notifications.systemDesc')}
                                checked={settings.notifSystem}
                                onChange={(v) => handleChange('notifSystem', v)}
                            />
                        </div>
                    )}

                    {/* TAB UNITS & LANGUAGE */}
                    {activeTab === 'units' && (
                        <div>
                            <SectionHeader title={t('settings.units.title')} desc={t('settings.units.desc')} />

                            <SettingRow label={t('settings.units.language')} desc={t('settings.units.languageDesc')}>
                                <select style={selectStyle} value={settings.language} onChange={(e) => handleChange('language', e.target.value)}>
                                    <option value="id">Indonesia</option>
                                    <option value="en">English (US)</option>
                                </select>
                            </SettingRow>

                            <SettingRow label={t('settings.units.areaUnit')} desc={t('settings.units.areaUnitDesc')}>
                                <select style={selectStyle} value={settings.areaUnit} onChange={(e) => handleChange('areaUnit', e.target.value)}>
                                    <option value="ha">Ha (Hektar)</option>
                                    <option value="m2">m² (Meter Persegi)</option>
                                </select>
                            </SettingRow>

                            <SettingRow label={t('settings.units.carbonUnit')} desc={t('settings.units.carbonUnitDesc')}>
                                <select style={selectStyle} value={settings.carbonUnit} onChange={(e) => handleChange('carbonUnit', e.target.value)}>
                                    <option value="Ton C">Ton C</option>
                                    <option value="Kg C">Kg C</option>
                                </select>
                            </SettingRow>

                            <SettingRow label={t('settings.units.dateFormat')} desc={t('settings.units.dateFormatDesc')}>
                                <select style={selectStyle} value={settings.dateFormat} onChange={(e) => handleChange('dateFormat', e.target.value)}>
                                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                    <option value="DD MMM YYYY">DD MMM YYYY</option>
                                </select>
                            </SettingRow>

                            <SettingRow label={t('settings.units.currency')} desc={t('settings.units.currencyDesc')}>
                                <select style={selectStyle} value={settings.currency} onChange={(e) => handleChange('currency', e.target.value)}>
                                    <option value="IDR (Rp)">IDR (Rp)</option>
                                    <option value="USD ($)">USD ($)</option>
                                </select>
                            </SettingRow>

                            {/* Ambang Batas Peringatan NDVI */}
                            <div style={{ padding: '20px 0', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <div style={labelStyle}>{t('settings.units.ndviThreshold')}</div>
                                    <div style={{
                                        padding: '4px 12px',
                                        borderRadius: '6px',
                                        background: '#e6f4eb',
                                        color: '#116a3a',
                                        fontWeight: 700,
                                        fontSize: '14px'
                                    }}>
                                        {Number(settings.ndviThreshold).toFixed(2)}
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min="0.10"
                                    max="0.90"
                                    step="0.05"
                                    value={settings.ndviThreshold}
                                    onChange={(e) => handleChange('ndviThreshold', parseFloat(e.target.value))}
                                    aria-label={t('settings.units.ndviThreshold')}
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
                                    {t('settings.units.ndviThresholdDesc')}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB DATA & DISPLAY */}
                    {activeTab === 'display' && (
                        <div>
                            <SectionHeader title={t('settings.display.title')} desc={t('settings.display.desc')} />
                            <SettingRow label={t('settings.display.timezone')} desc={t('settings.display.timezoneDesc')}>
                                <select style={selectStyle} value={settings.timezone} onChange={(e) => handleChange('timezone', e.target.value)}>
                                    <option value="WIB">WIB (UTC+7)</option>
                                    <option value="WITA">WITA (UTC+8)</option>
                                    <option value="WIT">WIT (UTC+9)</option>
                                </select>
                            </SettingRow>
                        </div>
                    )}

                    {/* TAB PRIVACY & DATA */}
                    {activeTab === 'privacy' && (
                        <div>
                            <SectionHeader title={t('settings.privacy.title')} desc={t('settings.privacy.desc')} />

                            <SettingRow label={t('settings.privacy.retention')} desc={t('settings.privacy.retentionDesc')}>
                                <select style={selectStyle} value={settings.auditLogRetention} onChange={(e) => handleChange('auditLogRetention', e.target.value)}>
                                    <option value="30d">{t('settings.privacy.days30')}</option>
                                    <option value="90d">{t('settings.privacy.days90')}</option>
                                    <option value="1y">{t('settings.privacy.year1')}</option>
                                </select>
                            </SettingRow>

                            <ToggleRow
                                label={t('settings.privacy.locationMeta')}
                                desc={t('settings.privacy.locationMetaDesc')}
                                checked={settings.includeLocationMetadata}
                                onChange={(v) => handleChange('includeLocationMetadata', v)}
                            />

                            {/* Kartu info keamanan */}
                            <div style={{
                                marginTop: '24px',
                                padding: '18px 20px',
                                borderRadius: '10px',
                                background: '#f6faf8',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', ...labelStyle }}>
                                    <ShieldCheck size={18} color="#116a3a" />
                                    {t('settings.privacy.securityTitle')}
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                                    <KeyRound size={16} color="#64748b" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <div style={{ fontSize: '13px', color: '#5c716a', lineHeight: 1.6 }}>{t('settings.privacy.jwt')}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <Database size={16} color="#64748b" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <div style={{ fontSize: '13px', color: '#5c716a', lineHeight: 1.6 }}>{t('settings.privacy.tenant')}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tombol Simpan (semua tab) */}
                    <div style={{ marginTop: '28px' }}>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                padding: '12px 24px',
                                fontSize: '14px',
                                fontWeight: 600,
                                borderRadius: '8px',
                                background: '#012d1d',
                                color: '#ffffff',
                                border: 'none',
                                cursor: saving ? 'wait' : 'pointer',
                                opacity: saving ? 0.7 : 1,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {saving ? t('settings.saving') : t('settings.save')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlatformSettings;
