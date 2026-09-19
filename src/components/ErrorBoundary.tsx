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
        <div className="min-h-screen bg-neo-bg flex flex-col items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-8 shadow-neo max-w-lg w-full transform -rotate-1">
            <h1 className="text-3xl font-black uppercase text-black mb-4">Something went wrong</h1>
            <p className="font-bold text-slate-600 mb-6">{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-neo-primary text-black font-black uppercase text-lg border-4 border-black py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-neo-pressed transition-all"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
