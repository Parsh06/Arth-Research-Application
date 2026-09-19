import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import * as Sentry from '@sentry/react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  eventId: string | null;
  error: Error | null;
}

export default class SystemErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    eventId: null,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, eventId: null, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Log to Sentry
    Sentry.withScope((scope) => {
      scope.setExtras(errorInfo as any);
      const eventId = Sentry.captureException(error);
      this.setState({ eventId });
    });
  }

  public render() {
    if (this.state.hasError) {
      // Determine error type based on error object
      const errorMsg = this.state.error?.message?.toLowerCase() || '';
      
      let title = "System Failure";
      let subtitle = "Error 500: Fatal Exception";
      let description = "The terminal encountered an unexpected exception while processing your request. Our engineering team has been automatically notified.";
      let actionLabel = "Reboot Terminal";
      let actionLink = "/";

      if (errorMsg.includes('network') || errorMsg.includes('failed to fetch')) {
        title = "Connection Lost";
        subtitle = "Error 000: Network Unavailable";
        description = "Your connection to the central servers has been lost. Please verify your internet connection and try again.";
        actionLabel = "Retry Connection";
        actionLink = window.location.pathname;
      } else if (errorMsg.includes('permission') || errorMsg.includes('unauthorized') || errorMsg.includes('missing or insufficient permissions')) {
        title = "Access Denied";
        subtitle = "Error 403: Forbidden";
        description = "You do not have the required clearance to access this sector of the terminal. If you believe this is an error, contact support.";
        actionLabel = "Return to Dashboard";
        actionLink = "/dashboard";
      } else if (errorMsg.includes('not found') || errorMsg.includes('404')) {
        title = "Resource Not Found";
        subtitle = "Error 404: Missing Data";
        description = "The requested data or portfolio could not be located in the databanks.";
        actionLabel = "Return to Dashboard";
        actionLink = "/dashboard";
      } else if (errorMsg.includes('expired')) {
        title = "Subscription Expired";
        subtitle = "Error 402: Payment Required";
        description = "Your access to this module has expired. Please renew your engine subscription to regain access.";
        actionLabel = "Renew Now";
        actionLink = "/plans";
      }

      return (
        <div className="min-h-screen bg-neo-bg flex items-center justify-center p-4 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]">
          <div className="max-w-2xl w-full bg-white border-4 border-black p-8 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-4 mb-8 border-b-4 border-black pb-6 border-dashed">
              <div className="bg-neo-danger border-4 border-black p-4 transform -rotate-3">
                <AlertTriangle className="w-12 h-12 text-black stroke-[3]" />
              </div>
              <div>
                <h1 className="text-4xl font-black uppercase text-black tracking-tighter">{title}</h1>
                <p className="text-xl font-bold uppercase tracking-widest text-slate-500 mt-2">{subtitle}</p>
              </div>
            </div>

            <div className="space-y-6">
              <p className="font-bold text-black text-lg">
                {description}
              </p>
              
              {this.state.eventId && (
                <div className="bg-black text-white p-4 font-mono text-sm border-4 border-black inline-block">
                  <span className="text-neo-primary">Tracking ID:</span> {this.state.eventId}
                </div>
              )}

              <div className="pt-8">
                <button 
                  onClick={() => window.location.href = actionLink}
                  className="w-full sm:w-auto bg-neo-primary text-black py-4 px-8 font-black uppercase tracking-wider text-xl border-4 border-black hover:bg-black hover:text-white transition-all flex items-center justify-center gap-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px]"
                >
                  <RotateCcw className="w-6 h-6 stroke-[3]" />
                  {actionLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
