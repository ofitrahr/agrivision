const ImpactSection = ({ icon, title, subtitle, description, children }) => (
  <div style={{
    background: '#ffffff',
    border: '1px solid #E9ECEF',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: '#1b4332',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff'
      }}>
        {icon}
      </div>
      <div>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: '#191c1d', margin: 0, lineHeight: '28px' }}>{title}</h3>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#414844', margin: 0, textTransform: 'uppercase' }}>
          {subtitle}
        </p>
      </div>
    </div>
    {children}
    <p style={{ fontSize: 14, lineHeight: '20px', color: '#414844', margin: 0 }}>{description}</p>
  </div>
);

export default ImpactSection;