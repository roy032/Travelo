import React from "react";
import Button from "../ui/Button";

/**
 * Error Boundary component to catch React component errors
 * Displays a fallback UI when an error occurs
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
          <div className='max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center'>
            <div className='mb-4'>
              <svg
                className='mx-auto h-16 w-16 text-red-500'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                />
              </svg>
            </div>

            <h1 className='text-2xl font-bold text-gray-900 mb-2'>
              Oops! Something went wrong
            </h1>

            <p className='text-gray-600 mb-6'>
              We encountered an unexpected error. Please try refreshing the page
              or contact support if the problem persists.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className='mb-6 text-left'>
                <summary className='cursor-pointer text-sm font-medium text-gray-700 mb-2'>
                  Error Details (Development Only)
                </summary>
                <div className='bg-gray-100 rounded p-4 text-xs overflow-auto max-h-48'>
                  <p className='font-semibold text-red-600 mb-2'>
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className='text-gray-700 whitespace-pre-wrap'>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className='flex gap-3 justify-center'>
              <Button variant='primary' onClick={this.handleReset}>
                Try Again
              </Button>
              <Button
                variant='secondary'
                onClick={() => (window.location.href = "/")}
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
