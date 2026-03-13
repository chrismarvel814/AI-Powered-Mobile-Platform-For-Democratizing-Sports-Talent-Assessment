import { Component } from 'react';

/**
 * ErrorBoundary — catches render errors in any child component tree and
 * shows a recovery screen instead of a blank page.
 */
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('🔴 ErrorBoundary caught an error:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#040d1a',
                    color: 'white',
                    fontFamily: 'Inter, sans-serif',
                    gap: '16px',
                    padding: '40px',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: '48px' }}>⚠️</div>
                    <h1 style={{ fontSize: '22px', fontWeight: 800 }}>Something went wrong</h1>
                    <p style={{ color: '#94a3b8', maxWidth: '400px', lineHeight: 1.6 }}>
                        An unexpected error occurred in the app. Your session data is safe.
                    </p>
                    {this.state.error && (
                        <pre style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '10px',
                            padding: '12px 16px',
                            fontSize: '12px',
                            color: '#f87171',
                            maxWidth: '600px',
                            overflowX: 'auto',
                            textAlign: 'left',
                        }}>
                            {this.state.error.message}
                        </pre>
                    )}
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '8px',
                            padding: '12px 28px',
                            background: 'linear-gradient(135deg, #00f5d4, #7c3aed)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '14px',
                            cursor: 'pointer',
                        }}
                    >
                        🔄 Reload App
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
