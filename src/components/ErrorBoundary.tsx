import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-900 flex items-center justify-center p-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-md text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
            <pre className="text-red-300 text-sm overflow-auto">
              {this.state.error?.message}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 