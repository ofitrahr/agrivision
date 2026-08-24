const DetailCard = ({ icon, label, value }) => (
  <div style={{
    background: '#ffffff',
    border: '1px solid #E9ECEF',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#414844' }}>
      {icon}
      <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>{label}</span>
    </div>
    <p style={{ fontSize: 20, fontWeight: 600, color: '#191c1d', margin: 0 }}>{value}</p>
  </div>
);

export default DetailCard;