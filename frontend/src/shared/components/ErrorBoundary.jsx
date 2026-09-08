import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{
          padding: '24px',
          borderRadius: '12px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          margin: '16px 0',
          fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 600, fontSize: '15px' }}>
            <AlertTriangle size={18} />
            <span>Terjadi kesalahan saat memuat tampilan</span>
          </div>
          <p style={{ fontSize: '13px', margin: '0 0 12px 0', color: '#b91c1c' }}>
            {this.state.error?.message || 'Komponen mengalami kendala teknis.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500
            }}
          >
            <RotateCcw size={13} />
            Coba Muat Ulang Komponen
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
