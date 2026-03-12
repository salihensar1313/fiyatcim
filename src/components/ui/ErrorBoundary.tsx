"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-dark-900 dark:text-dark-50">
              Bir hata oluştu
            </h2>
            <p className="mt-1 text-sm text-dark-500 dark:text-dark-400">
              Sayfa yüklenirken beklenmeyen bir hata meydana geldi.
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <RotateCcw size={16} />
            Tekrar Dene
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
