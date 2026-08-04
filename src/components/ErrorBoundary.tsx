import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ClinOS] Uncaught runtime error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5 text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold mb-2">ClinOS Clinical Engine Workspace</h1>
            <p className="text-slate-400 text-sm mb-6">
              An unexpected runtime exception was caught by the clinical safety boundary.
            </p>
            {this.state.error && (
              <div className="bg-slate-950/80 p-3 rounded-lg text-left text-xs text-red-300 font-mono overflow-auto max-h-32 mb-6 border border-red-900/40">
                {this.state.error.toString()}
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-sky-600/20"
            >
              <RefreshCw className="w-4 h-4" /> Reload Clinical Workspace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
