import { AlertTriangle, BarChart3, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

const KpiStrip = ({ selectedLayer, activeSubLayer, statsData, farm }) => {
  const stats = statsData?.stats ?? null;
  const anomaly = statsData?.anomaly ?? null;
  const sensorData = statsData?.sensor_data ?? null;
  const forecast = statsData?.forecast ?? null;

  const buildKpiItems = () => {
    if (!statsData?.has_data) return [];

    const anomalyHa = (anomaly?.count != null && farm?.total_area_ha && stats?.total_count)
      ? ((anomaly.count / stats.total_count) * farm.total_area_ha).toFixed(2)
      : '-';

    const actualLayer = selectedLayer === 'soilnpk' 
      ? activeSubLayer 
      : selectedLayer;

    if (actualLayer === 'ndvi') {
      const isUp = stats?.change > 0;
      return [
        { label: 'Rerata NDVI', value: stats?.mean?.toFixed(3) ?? '-', unit: 'index', icon: BarChart3 },
        { 
          label: 'Perubahan Q-to-Q', 
          value: stats?.change ? (isUp ? `+${stats.change.toFixed(3)}` : stats.change.toFixed(3)) : '-', 
          unit: isUp ? '(lebih subur)' : (stats?.change < 0 ? '(kurang subur)' : ''), 
          icon: isUp ? ArrowUpRight : ArrowDownRight,
          trend: isUp ? 'up' : (stats?.change < 0 ? 'down' : '')
        },
        { label: 'Area Anomali', value: `${anomalyHa} Ha`, unit: `(${anomaly?.percent?.toFixed(1) ?? 0}%)`, icon: AlertTriangle, trend: 'down' },
      ];
    }

    if (actualLayer === 'yield') {
      const isUp = stats?.change > 0;
      return [
        { label: 'Rerata Produktivitas', value: stats?.mean?.toFixed(2) ?? '-', unit: 'Ton/Ha', icon: BarChart3 },
        { 
          label: 'Perubahan', 
          value: stats?.change ? (isUp ? `+${stats.change.toFixed(2)}` : stats.change.toFixed(2)) : '-', 
          unit: 'Ton/Ha', 
          icon: isUp ? ArrowUpRight : ArrowDownRight,
          trend: isUp ? 'up' : (stats?.change < 0 ? 'down' : '')
        },
        { label: 'Terendah', value: stats?.min?.toFixed(2) ?? '-', unit: 'Ton/Ha' },
        { label: 'Tertinggi', value: stats?.max?.toFixed(2) ?? '-', unit: 'Ton/Ha' },
        { label: 'Estimasi Berikutnya', value: forecast?.value?.toFixed(2) ?? '-', unit: 'Ton/Ha', icon: TrendingUp },
      ];
    }

    if (actualLayer === 'nitrogen' || actualLayer === 'phosphorus' || actualLayer === 'potassium' || actualLayer === 'soilnpk') {
      return [
        { label: 'Nitrogen (N)', value: sensorData?.nitrogen_mean ?? '-', unit: 'kg/Ha' },
        { label: 'Fosfor (P)', value: sensorData?.phosphorus_mean ?? '-', unit: 'kg/Ha' },
        { label: 'Kalium (K)', value: sensorData?.potassium_mean ?? '-', unit: 'kg/Ha' },
      ];
    }

    // Default (SOC, Biomass)
    const unit = actualLayer === 'soc' ? 'Ton C/Ha' : 'Kg C/Ha';
    return [
      { label: 'Rerata', value: stats?.mean?.toFixed(3) ?? '-', unit, icon: BarChart3 },
      { label: 'Min', value: stats?.min?.toFixed(3) ?? '-', unit },
      { label: 'Max', value: stats?.max?.toFixed(3) ?? '-', unit },
      { label: 'Std Dev', value: stats?.std_dev?.toFixed(3) ?? '-', unit },
      { label: 'Area Anomali', value: `${anomalyHa} Ha`, unit: `(${anomaly?.percent?.toFixed(1) ?? 0}%)`, icon: AlertTriangle, trend: 'down' },
    ];
  };

  const kpiItems = buildKpiItems();

  if (kpiItems.length === 0) return null;

  return (
    <div className="agro-kpi-strip">
      {kpiItems.map((kpi, idx) => {
        const Icon = kpi.icon;
        const valClass = kpi.trend === 'up' ? 'agro-kpi-up' : kpi.trend === 'down' ? 'agro-kpi-down' : '';
        return (
          <div key={idx} className="agro-kpi-card">
            <div className="agro-kpi-label">{kpi.label}</div>
            <div className={`agro-kpi-val ${valClass}`}>
              {Icon && <Icon size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} />}
              {kpi.value} <span style={{ fontSize: '0.85em', opacity: 0.8 }}>{kpi.unit}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KpiStrip;
