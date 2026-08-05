export const DEFAULT_SETTINGS = {
    areaUnit: 'ha', // 'ha' atau 'm2'
    timezone: 'WIB', // 'WIB', 'WITA', 'WIT'
    ndviThreshold: 0.35,
    language: 'id', // 'id' atau 'en'
    dateFormat: 'DD/MM/YYYY'
};

export const getStoredSettings = () => {
    try {
        const saved = localStorage.getItem('agrivision_settings');
        if (saved) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.error("Gagal membaca settings dari localStorage", e);
    }
    return DEFAULT_SETTINGS;
};

export const formatAreaValue = (areaHa) => {
    const num = parseFloat(areaHa) || 0;
    const settings = getStoredSettings();
    
    if (settings.areaUnit === 'm2') {
        const m2Val = num * 10000;
        return `${m2Val.toLocaleString('id-ID')} m²`;
    }
    return `${num.toLocaleString('id-ID')} Ha`;
};
