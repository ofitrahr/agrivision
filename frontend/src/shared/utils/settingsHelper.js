import api from '../api/axios';

const STORAGE_KEY = 'agrivision_settings';

// Harus selaras dengan DEFAULT_PREFERENCES di backend auth_routes.py
export const DEFAULT_SETTINGS = {
    areaUnit: 'ha', // 'ha' atau 'm2'
    timezone: 'WIB', // 'WIB', 'WITA', 'WIT'
    ndviThreshold: 0.35,
    language: 'id', // 'id' atau 'en'
    dateFormat: 'DD/MM/YYYY',
    carbonUnit: 'Ton C',
    currency: 'IDR (Rp)',
    notifInApp: true,
    notifAnomaly: true,
    notifReports: true,
    notifSystem: true,
    auditLogRetention: '90d', // '30d', '90d', '1y'
    includeLocationMetadata: true,
};

export const getStoredSettings = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.error("Gagal membaca settings dari localStorage", e);
    }
    return DEFAULT_SETTINGS;
};

// Simpan lokal lalu beri tahu seluruh UI
export const storeSettings = (settings) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
        console.error("Gagal menyimpan settings ke localStorage", e);
    }
    window.dispatchEvent(new Event('settingsUpdated'));
};

// Ambil preferensi dari server; jika offline/gagal, tetap pakai data lokal
export const syncSettingsFromServer = async () => {
    try {
        const res = await api.get('/auth/settings');
        const serverSettings = res.data?.data;
        if (serverSettings && typeof serverSettings === 'object') {
            const merged = { ...DEFAULT_SETTINGS, ...serverSettings };
            storeSettings(merged);
            return merged;
        }
    } catch (e) {
        console.warn("Sinkronisasi settings dari server gagal, memakai data lokal", e);
    }
    return getStoredSettings();
};

// Angka & satuan terpisah, untuk tampilan yang menaruh satuan di tempat lain
export const getAreaDisplay = (areaHa) => {
    const num = parseFloat(areaHa) || 0;
    if (getStoredSettings().areaUnit === 'm2') {
        return { value: (num * 10000).toLocaleString('id-ID'), unit: 'm²' };
    }
    return { value: num.toLocaleString('id-ID'), unit: 'Ha' };
};

export const formatAreaValue = (areaHa) => {
    const { value, unit } = getAreaDisplay(areaHa);
    return `${value} ${unit}`;
};
