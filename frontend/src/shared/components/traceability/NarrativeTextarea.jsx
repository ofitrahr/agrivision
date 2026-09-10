const NarrativeTextarea = ({ id, label, value, maxLength, rows = 3, placeholder, onChange }) => {
  const safeValue = value || '';
  return (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <label htmlFor={id} style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: '#5C7A6D' }}>
        {label}
      </label>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', color: safeValue.length > maxLength - 100 ? '#fdb134' : '#5C7A6D' }}>
        {safeValue.length} / {maxLength} chars
      </span>
    </div>
    <textarea
      id={id}
      rows={rows}
      value={safeValue}
      onChange={onChange}
      maxLength={maxLength}
      style={{
        width: '100%', padding: '12px 16px', border: '1px solid #E0EBE4',
        borderRadius: 8, fontSize: 16, color: '#191c1d',
        outline: 'none', resize: 'vertical', fontFamily: 'inherit',
        boxSizing: 'border-box'
      }}
      placeholder={placeholder}
    />
  </div>
  );
};

export default NarrativeTextarea;