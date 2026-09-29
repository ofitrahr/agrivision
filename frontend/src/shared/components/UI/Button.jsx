import React from 'react';

const Button = ({
  type = 'button',
  variant = 'secondary',
  children,
  onClick,
  isLoading = false,
  disabled = false,
  className = '',
  style,
  loadingText = 'Loading...',
  icon,
  borderRadius = '8px',
  ...rest
}) => {
  const isDisabled = disabled || isLoading;

  const variantStyles = {
    primary: {
      background: 'var(--color-primary-container)',
      color: '#ffffff',
      border: '1px solid transparent',
      boxShadow: '0 2px 8px rgba(5, 59, 38, 0.2)',
    },
    secondary: {
      background: 'transparent',
      color: 'var(--color-primary-container)',
      border: '1.5px solid var(--color-border-muted)',
    },
    outline: {
      background: 'transparent',
      color: 'var(--color-primary-container)',
      border: '1.5px solid var(--color-primary-container)',
    },
  };

  return (
    <button
      type={type}
      onClick={onClick && !isDisabled ? onClick : undefined}
      disabled={isDisabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        flexShrink: 0,
        padding: '10px 24px',
        borderRadius,
        fontSize: 14,
        fontWeight: 600,
        fontFamily: 'var(--font-body)',
        whiteSpace: 'nowrap',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
        position: 'relative',
        ...variantStyles[variant],
        ...style,
      }}
      className={`reuse-btn reuse-btn-${variant} ${className}`}
      {...rest}
    >
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}

      <span style={{ display: 'grid', pointerEvents: 'none' }}>
        <span
          aria-hidden={isLoading}
          style={{
            gridArea: '1/1',
            visibility: isLoading ? 'hidden' : 'visible',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {children}
        </span>
        <span
          aria-hidden={!isLoading}
          style={{
            gridArea: '1/1',
            visibility: isLoading ? 'visible' : 'hidden',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {loadingText}
        </span>
      </span>
    </button>
  );
};

export default Button;