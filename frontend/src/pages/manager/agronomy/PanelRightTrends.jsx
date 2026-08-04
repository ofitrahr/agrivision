import { useState, useEffect } from 'react';
import { TrendingUp, Calculator, Leaf } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const MOCK_TREND = [
  { period: 'Jan-Mar 2025', value: 39.8 },
  { period: 'Apr-Jun 2025', value: 40.2 },
  { period: 'Jul-Sep 2025', value: 41.5 },
  { period: 'Okt-Des 2025', value: 41.8 },
  { period: 'Jan-Mar 2026', value: 42.2 },
];

const formatRupiah = (number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);

const PanelRightTrends = ({ selectedLayer, periodIdx, farm }) => {
  const [priceInput, setPriceInput] = useState('200.000');
  const [carbonResult, setCarbonResult] = useState({ value: 0, co2e: 0, totalC: 0 });

  useEffect(() => {
    if (selectedLayer === 'soc') {
      const meanSOC = 42.156;
      const totalHa = farm?.total_area_ha || 25;
      const totalC = meanSOC * totalHa;
      const co2e = totalC * 3.67;
      const price = parseInt(priceInput.replace(/\./g, ''), 10) || 200000;
      const value = co2e * price;
      setCarbonResult({ value, co2e, totalC });
    }
  }, [selectedLayer, priceInput, farm]);

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
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOCK_TREND} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
