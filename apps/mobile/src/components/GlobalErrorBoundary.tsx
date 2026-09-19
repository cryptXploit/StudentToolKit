import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-background p-6">
          <div className="bg-card border border-slate-200 dark:border-slate-800 p-8 rounded-3xl max-w-sm w-full text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full mb-4 text-muted">
              <RefreshCw size={24} />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Something went wrong</h2>
            <p className="text-sm text-muted mb-6 leading-relaxed">
              We encountered an unexpected error. Don't worry, your data is saved locally.
            </p>
            <button
              onClick={this.handleReload}
              className="w-full bg-foreground text-background py-3 rounded-xl font-medium active:scale-[0.98] transition-transform"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
