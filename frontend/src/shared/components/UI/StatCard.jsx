import React from 'react';

const StatCard = ({ title, value, unit, icon, badgeText, badgeType, iconColor }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        {icon && (
          <span 
            className="material-symbols-outlined stat-card-icon" 
            style={{ color: iconColor || 'var(--color-primary-container)' }}
          >
            {icon}
          </span>
        )}
        {badgeText && (
          <span className={`stat-badge ${badgeType || 'success'}`}>
            {badgeText}
          </span>
        )}
      </div>
      <div className="stat-label">{title}</div>
      <div className="stat-value">
        {value}
        {unit && <span className="unit">{unit}</span>}
      </div>
    </div>
  );
};

export default StatCard;
