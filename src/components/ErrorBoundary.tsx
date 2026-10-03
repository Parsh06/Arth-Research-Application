import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background bg-mesh text-foreground flex flex-col items-center justify-center p-6 transition-colors duration-200">
          <div className="glass-panel max-w-lg w-full p-8 border border-border shadow-2xl space-y-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-semibold block mb-1">
                Security & Fault Isolation Protocol
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-serif">
                Session Interruption Detected
              </h1>
              <p className="text-xs text-muted-foreground font-mono mt-2 leading-relaxed">
                An isolated exception occurred while rendering this interface module. The error has been captured and security defenses remain fully active.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="text-left bg-muted/40 border border-border/80 rounded-md p-3.5 space-y-1.5 font-mono">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-bold">
                  Telemetry Diagnostic Log:
                </span>
                <p className="text-xs text-destructive break-words font-medium">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 bg-primary hover:opacity-90 text-primary-foreground font-semibold py-2.5 px-4 rounded-md text-xs font-mono transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              >
                Reload Session
              </button>
              <button
                type="button"
                onClick={() => window.location.href = '/'}
                className="flex-1 glass-panel text-foreground hover:bg-muted/40 font-semibold py-2.5 px-4 rounded-md text-xs font-mono transition-all cursor-pointer border border-border active:scale-[0.98]"
              >
                Return to Terminal
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
