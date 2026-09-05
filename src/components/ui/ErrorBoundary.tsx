import { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from './Card';
import { Button } from './Button';

interface Props {
  children?: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[AutomataVerse ErrorBoundary] caught uncaught page crash:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: '340px', padding: '24px' }}>
          <Card glass style={{ padding: '32px', maxWidth: '420px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', border: '1.5px solid var(--accent-error)' }} className="animate-scale-in">
            <div style={{ fontSize: '36px' }}>⚠️</div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)' }}>Component Error Fallback</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.45 }}>
                {this.props.fallbackMessage || "An unexpected error occurred while rendering this workspace page panel."}
              </p>
              {this.state.error && (
                <pre style={{ fontSize: '10px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '4px', textAlign: 'left', overflowX: 'auto', maxWidth: '100%', marginTop: '12px', color: 'var(--accent-error)', fontFamily: 'var(--font-mono)' }}>
                  {this.state.error.message}
                </pre>
              )}
            </div>
            <Button variant="primary" size="sm" onClick={this.handleReset} glow style={{ width: '100%', background: 'rgba(255,93,115,0.08)', borderColor: 'var(--accent-error)', color: 'var(--accent-error)' }}>
              Recover & Reset View
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
