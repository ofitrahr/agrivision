const SparklineArea = ({
  data = [30, 45, 38, 55, 48, 65, 80],
  strokeColor = '#116a3a',
  fillColor = 'rgba(17, 106, 58, 0.08)',
  width = 120,
  height = 55,
}) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const paddingY = 8;
  const graphHeight = height - paddingY * 2;
  const stepX = width / (data.length - 1);

  const points = data.map((val, idx) => {
    const x = idx * stepX;
    const y = height - paddingY - ((val - min) / range) * graphHeight;
    return { x, y };
  });

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    pathD += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;
  const lastPoint = points[points.length - 1];
  const maxPoint = points.reduce((prev, curr) => (curr.y < prev.y ? curr : prev), points[0]);

  return (
    <div className="stat-card-chart-wrap" style={{ width, height }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <line
          x1="0"
          y1={maxPoint.y}
          x2={width}
          y2={maxPoint.y}
          stroke="var(--color-border-muted)"
          strokeDasharray="3 3"
          strokeWidth="1"
        />
        <path d={areaD} fill={fillColor} />
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
        <circle cx={lastPoint.x} cy={lastPoint.y} r="3.5" fill="#ffffff" stroke={strokeColor} strokeWidth="2" />
      </svg>
    </div>
  );
};

const StatCard = ({
  title,
  headerUnit,
  value,
  unit,
  inlineUnit,
  subtext,
  badgeText,
  badgeType = 'success',
  variant = 'white', // 'white' | 'dark'
  icon: IconProp,
  silhouette: SilhouetteProp,
  silhouetteColor,
  chartData,
  chartColor,
  chartFill,
  onClick,
  style,
}) => {
  const isDark = variant === 'dark';
  const isTextValue = typeof value === 'string' && isNaN(Number(value)) && !value.startsWith('Rp');
  const SilhouetteIcon = SilhouetteProp || IconProp;

  return (
    <div 
      className={`stat-card ${isDark ? 'stat-card-dark' : ''} ${chartData ? 'stat-card-with-chart' : ''} ${onClick ? 'stat-card-clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={style}
    >
      <div className="stat-card-main-content">
        <div className="stat-card-header-clean">
          <span className="stat-label">{title}</span>
          {headerUnit && (
            <span className="stat-header-unit">
              {headerUnit}
            </span>
          )}
        </div>

        <div className="stat-card-body-row">
          <div className="stat-card-info-side">
            <div className={`stat-value ${isTextValue ? 'stat-value-text' : ''}`}>
              <span>{value ?? 0}</span>
              {inlineUnit && (
                <span className="stat-unit-inline" style={{ color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'var(--color-text-muted)' }}>
                  {inlineUnit}
                </span>
              )}
            </div>

            {unit && (
              <div 
                className="stat-unit-label"
                style={{ color: isDark ? 'rgba(255, 255, 255, 0.85)' : 'var(--color-text-muted)' }}
              >
                {unit}
              </div>
            )}

            {badgeText && (
              <div style={{ marginTop: '8px' }}>
                <span className={`stat-badge ${badgeType === 'neutral' ? 'stat-badge-neutral' : isDark ? 'stat-badge-dark-pill' : 'stat-badge-success'}`}>
                  {badgeText}
                </span>
              </div>
            )}

            {subtext && !badgeText && (
              <div className="stat-subtext" style={{ color: isDark ? '#ffffff' : 'var(--color-text-muted)', opacity: isDark ? 0.9 : 1 }}>
                {subtext}
              </div>
            )}
          </div>

          {chartData && !isDark && !SilhouetteIcon && (
            <SparklineArea
              data={Array.isArray(chartData) ? chartData : undefined}
              strokeColor={chartColor || 'var(--color-main-green)'}
              fillColor={chartFill || 'rgba(17, 106, 58, 0.08)'}
            />
          )}
        </div>
      </div>

      {SilhouetteIcon && (
        <div 
          className="stat-card-silhouette" 
          style={silhouetteColor ? { color: silhouetteColor } : undefined}
          aria-hidden="true"
        >
          {typeof SilhouetteIcon === 'function' || (typeof SilhouetteIcon === 'object' && SilhouetteIcon !== null) ? (
            <SilhouetteIcon size={80} strokeWidth={1.5} />
          ) : (
            <span className="material-symbols-outlined" style={{ fontSize: '80px' }}>
              {SilhouetteIcon}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
