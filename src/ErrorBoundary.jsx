import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Recover Well crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="error-boundary" role="alert">
        <h1>Something went wrong</h1>
        <p>
          Recover Well hit an unexpected problem. Demo profiles are kept only in this open page, so
          reloading will clear them. If someone may be having an emergency, contact your local
          emergency number now.
        </p>
        <button type="button" onClick={() => window.location.reload()}>
          Reload the page
        </button>
      </main>
    );
  }
}

export default ErrorBoundary;
