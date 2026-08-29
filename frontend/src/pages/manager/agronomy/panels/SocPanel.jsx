import { useState } from 'react';
import { Calculator, Leaf } from 'lucide-react';
import { DistributionChart, AnomalyWarning, SummaryStats } from './CommonComponents';

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

const SocPanel = ({ statsData, statsLoading, farm }) => {
  const [priceInput, setPriceInput] = useState('200.000');

  // Compute derived state
  const socValue = statsData?.stats?.mean ?? 0;
  const totalHa = farm?.total_area_ha || 0;
  const totalC = socValue * totalHa;
  const co2e = totalC * 3.67;
  const price = parseInt(priceInput.replace(/\D/g, ''), 10) || 200000;
  const carbonResult = { value: co2e * price, co2e, totalC };

  const anomalyHa = statsData?.anomaly?.count != null && farm?.total_area_ha && statsData?.stats?.total_count
    ? ((statsData.anomaly.count / statsData.stats.total_count) * farm.total_area_ha).toFixed(2) : null;

  return (
    <div className="agro-panel agro-panel-left">
      <h2 style={{ fontSize: 16, marginTop: 0, marginBottom: 16, color: '#116a3a' }}>Stok Karbon Tanah (SOC)</h2>
      <DistributionChart histogram={statsData?.histogram} loading={statsLoading} layerLabel="SOC" />
      <AnomalyWarning anomaly={statsData?.anomaly} anomalyHa={anomalyHa} anomalyPercent={statsData?.anomaly?.percent ?? 0} selectedLayer="SOC" />
      <div className="agro-panel-divider" />
      <SummaryStats stats={statsData?.stats} loading={statsLoading} />
      <div className="agro-panel-divider" />
      
      <div className="agro-panel-section">
        <div className="agro-panel-label"><Calculator size={14} style={{ display: 'inline', marginRight: 6 }} /> Estimasi Nilai Ekonomi</div>
        <div className="agro-carbon-box">
          <div className="agro-carbon-val">{formatRupiah(carbonResult.value)}</div>
          <div className="agro-carbon-co2">
            <Leaf size={13} style={{ display: 'inline', marginRight: 4, color: '#116a3a' }} />
            {carbonResult.co2e.toFixed(2)} Ton CO2e ({carbonResult.totalC.toFixed(2)} Ton C)
          </div>
          <label className="agro-carbon-label">Harga Karbon (Rp/Ton CO2e)</label>
          <input type="text" className="agro-carbon-input" value={priceInput} onChange={(e) => {
            let val = e.target.value.replace(/\D/g, '');
            setPriceInput(val ? parseInt(val, 10).toLocaleString('id-ID') : '');
          }} />
        </div>
      </div>
    </div>
  );
};
export default SocPanel;
