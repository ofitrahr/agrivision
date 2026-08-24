const NarrativeTextarea = ({ id, label, value, maxLength, rows = 3, placeholder, onChange }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <label htmlFor={id} style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#414844' }}>
        {label}
      </label>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', color: value.length > maxLength - 100 ? '#D90429' : '#6C757D' }}>
        {value.length} / {maxLength} chars
      </span>
    </div>
    <textarea
      id={id}
      rows={rows}
      value={value}
      onChange={onChange}
      maxLength={maxLength}
      style={{
        width: '100%', padding: '12px 16px', border: '1px solid #E9ECEF',
        borderRadius: 8, fontSize: 16, color: '#191c1d',
        outline: 'none', resize: 'vertical', fontFamily: 'inherit',
        boxSizing: 'border-box'
      }}
      placeholder={placeholder}
    />
  </div>
);

export default NarrativeTextarea;