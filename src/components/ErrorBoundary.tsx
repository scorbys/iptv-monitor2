"use client";

import React from "react";
import { componentLogger } from "@/utils/debugLogger";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    componentLogger.error("Chat Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed bottom-6 right-6 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
          <p className="text-red-800 text-sm">
            Chat mengalami error. Silakan refresh halaman.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;