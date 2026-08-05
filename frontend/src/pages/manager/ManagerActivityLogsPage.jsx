import React, { useEffect, useState } from 'react';
import api from '../../shared/api/axios';
import Card from '../../shared/components/UI/Card';

const ManagerActivityLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await api.get('/manager/activities?limit=50');
                if (res.data.success) {
                    setLogs(res.data.data);
                }
            } catch (error) {
                console.error("Gagal mengambil riwayat log aktivitas manager", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Riwayat Log Aktivitas</h1>
                    <p className="page-subtitle">Daftar seluruh jejak aktivitas penugasan lahan & manajemen proyek Anda.</p>
                </div>
            </div>

            <Card title="Seluruh Aktivitas Proyek">
                {loading ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        Memuat data aktivitas...
                    </div>
                ) : logs.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        Belum ada aktivitas tercatat di proyek ini.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
                        {logs.map((item) => (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', borderRadius: '8px', background: 'var(--color-surface-container-low)' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-primary)' }}>{item.icon}</span>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--color-text-main)', fontWeight: 600 }}>{item.text}</p>
                                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted)' }}>{item.subtext}</p>
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                    {item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ManagerActivityLogsPage;
