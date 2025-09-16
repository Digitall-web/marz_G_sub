import React from 'react';

interface ErrorBoundaryState { error: Error | null; }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Runtime error caught by ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          fontFamily: 'sans-serif',
          background: '#fff',
          padding: '2rem'
        }}>
          <div style={{
            maxWidth: 600,
            width: '100%',
            border: '1px solid #fca5a5',
            background: '#fef2f2',
            color: '#b91c1c',
            padding: '1rem',
            borderRadius: 12,
            fontSize: 14,
            lineHeight: 1.5
          }}>
            <strong>خطا در اجرای برنامه</strong>
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{this.state.error.message}</pre>
            <button onClick={() => window.location.reload()} style={{
              marginTop: 12,
              background: '#b91c1c',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '6px 14px',
              cursor: 'pointer'
            }}>بارگذاری مجدد</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
