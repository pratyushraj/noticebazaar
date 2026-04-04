import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, MessageSquare } from 'lucide-react';
import { trackEvent } from '@/lib/utils/analytics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string; // Component name for better error tracking
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Track error for analytics
    trackEvent({
      event: 'error_boundary_caught',
      error_message: error.message,
      error_stack: error.stack?.substring(0, 500), // Limit stack trace length
      component_name: this.props.name || 'unknown',
      error_id: this.state.errorId,
      user_agent: navigator.userAgent,
      url: window.location.href,
    });

    console.error('ErrorBoundary caught an error:', {
      error,
      errorInfo,
      componentName: this.props.name,
      errorId: this.state.errorId,
    });
  }

  handleReload = () => {
    trackEvent({ event: 'error_boundary_reload', error_id: this.state.errorId });
    window.location.reload();
  };

  handleGoHome = () => {
    trackEvent({ event: 'error_boundary_go_home', error_id: this.state.errorId });
    window.location.href = '/';
  };

  handleReportIssue = () => {
    trackEvent({ event: 'error_boundary_report_issue', error_id: this.state.errorId });
    const subject = encodeURIComponent(`App Error Report - ${this.state.errorId}`);
    const body = encodeURIComponent(`
Error ID: ${this.state.errorId}
Component: ${this.props.name || 'Unknown'}
Error: ${this.state.error?.message || 'Unknown error'}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}

Please describe what you were doing when this error occurred:
[Your description here]
    `.trim());
    window.open(`mailto:support@creatorarmour.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="nb-screen-height bg-slate-950 text-white flex items-center justify-center p-4">
          <div className="text-center max-w-sm mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>

            <h2 className="text-xl font-bold mb-3">
              Something went wrong
            </h2>

            <p className="text-white/70 mb-6 leading-relaxed">
              We encountered an unexpected error. Don't worry, this has been reported and we're working on it.
            </p>

            {/* Error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-white/5 rounded-lg p-3 mb-6 text-left">
                <p className="text-xs text-white/50 mb-2">Error Details (Dev Mode):</p>
                <p className="text-xs text-red-300 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full h-12 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>

              <button
                type="button"
                onClick={this.handleReportIssue}
                className="w-full h-12 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <MessageSquare className="w-4 h-4" />
                Report Issue
              </button>
            </div>

            {this.state.errorId && (
              <p className="text-xs text-white/40 mt-4">
                Error ID: {this.state.errorId}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
