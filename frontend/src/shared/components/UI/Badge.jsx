import React from 'react';

// status can be 'active', 'trial', 'expired', 'stable', 'warning'
const Badge = ({ status, children }) => {
  return (
    <span className={`badge badge-${status || 'active'}`}>
      {children}
    </span>
  );
};

export default Badge;
