import { useState, useEffect } from 'react';
import { TrendingUp, Calculator, Leaf } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const formatRupiah = (number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);

const PanelRightTrends = ({ selectedLayer, periodIdx, farm, statsData }) => {
  const [priceInput, setPriceInput] = useState('200.000');
  const [carbonResult, setCarbonResult] = useState({ value: 0, co2e: 0, totalC: 0 });

  const trendData = statsData?.trend ?? [];
  const meanSOC = statsData?.stats?.mean ?? null;

  useEffect(() => {
    if (selectedLayer === 'soc') {
      const socValue = meanSOC ?? 0;
      const totalHa = farm?.total_area_ha || 0;
      const totalC = socValue * totalHa;
      const co2e = totalC * 3.67;
      const price = parseInt(priceInput.replace(/\./g, ''), 10) || 200000;
      const value = co2e * price;
      setCarbonResult({ value, co2e, totalC });
    }
  }, [selectedLayer, priceInput, farm, meanSOC]);

  const handlePriceChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val) {
      setPriceInput(parseInt(val, 10).toLocaleString('id-ID'));
    } else {
      setPriceInput('');
    }
  };

  return (
    <>
      {/* Tren Lintas Waktu */}
      <div className="agro-panel-section">
        <div className="agro-panel-label">
          <TrendingUp size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
          Tren Lintas Waktu
        </div>
        <div className="agro-chart-wrapper-tall">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="period" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 6,
                    border: '1px solid #E0EBE4',
                    boxShadow: 'none',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#116a3a"
                  strokeWidth={2}
                  fill="#116a3a"
                  fillOpacity={0.1}
                  dot={{ fill: '#116a3a', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 12, color: '#9CA3AF' }}>
              Belum ada data tren
            </div>
          )}
        </div>
      </div>

      {/* Kalkulator Karbon - hanya tampil saat layer SOC */}
      {selectedLayer === 'soc' && (
        <>
          <div className="agro-panel-divider" />
          <div className="agro-panel-section">
            <div className="agro-panel-label">
              <Calculator size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
              Estimasi Nilai Ekonomi
            </div>

            <div className="agro-carbon-box">
              <div className="agro-carbon-val">{formatRupiah(carbonResult.value)}</div>
              <div className="agro-carbon-co2">
                <Leaf size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom', color: '#116a3a' }} />
                {carbonResult.co2e.toFixed(2)} Ton CO2e ({carbonResult.totalC.toFixed(2)} Ton C)
              </div>

              <label className="agro-carbon-label">Harga Karbon (Rp/Ton CO2e)</label>
              <input
                type="text"
                className="agro-carbon-input"
                value={priceInput}
                onChange={handlePriceChange}
              />
              <p className="agro-carbon-note">* Claim Est. = Ton C x 3.67 x Harga</p>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default PanelRightTrends;
