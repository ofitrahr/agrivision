const DetailCard = ({ icon, label, value }) => (
  <div style={{
    background: '#ffffff',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
    transform: 'translateY(-2px)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#414844' }}>
      {icon}
      <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' }}>{label}</span>
    </div>
    <p style={{ fontSize: 20, fontWeight: 600, color: value ? '#191c1d' : '#adb5bd', margin: 0 }}>{value || '-'}</p>
  </div>
);

export default DetailCard;