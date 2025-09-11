import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ErrorFallbackProps } from '@/lib/types';

// Error Fallback Component for general errors
export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const isDevelopment = import.meta.env.DEV;

  return (
    <div 
      role="alert" 
      className="min-h-screen flex items-center justify-center bg-gray-50 p-4"
    >
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-600">
            Oops! Something went wrong
          </CardTitle>
          <CardDescription>
            We're sorry, but something unexpected happened. Please try refreshing the page.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isDevelopment && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <details className="mt-2">
                  <summary className="cursor-pointer font-medium">
                    Error Details (Development Mode)
                  </summary>
                  <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-32">
                    {error.message}
                    {error.stack && '\n\n' + error.stack}
                  </pre>
                </details>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={resetErrorBoundary}
              className="flex-1"
              size="lg"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="flex-1"
              size="lg"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
          
          <p className="text-sm text-gray-500 text-center">
            If this problem persists, please contact support at{' '}
            <a 
              href="mailto:support@lab404.com" 
              className="text-blue-600 hover:underline"
            >
              support@lab404.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Specialized Error Fallback for Page-level errors
export function PageErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Unable to load this page
        </h2>
        <p className="text-gray-600 mb-6">
          Something went wrong while loading this page. Please try again.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={resetErrorBoundary}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}

// Component-level Error Fallback (smaller, inline)
export function ComponentErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <Alert variant="destructive" className="m-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>Component failed to load</span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetErrorBoundary}
          className="ml-2"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}

// Error logging function
const logError = (error: Error, errorInfo: React.ErrorInfo) => {
  if (import.meta.env.PROD) {
    // In production, send to error tracking service (Sentry, LogRocket, etc.)
    console.error('Error Boundary caught an error:', {
      error: {
        message: error.message,
        stack: error.stack,
      },
      errorInfo,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  } else {
    // In development, log to console
    console.error('Error Boundary caught an error:', error, errorInfo);
  }
};

// Main Error Boundary wrapper component
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  level?: 'app' | 'page' | 'component';
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export function ErrorBoundary({ 
  children, 
  fallback, 
  level = 'app',
  onError 
}: ErrorBoundaryProps) {
  // Select appropriate fallback based on level
  const getFallback = () => {
    if (fallback) return fallback;
    
    switch (level) {
      case 'app':
        return ErrorFallback;
      case 'page':
        return PageErrorFallback;
      case 'component':
        return ComponentErrorFallback;
      default:
        return ErrorFallback;
    }
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={getFallback()}
      onError={(error, errorInfo) => {
        logError(error, errorInfo);
        onError?.(error, errorInfo);
      }}
      onReset={() => {
        // Clear any error states when resetting
        if (level === 'app') {
          // Reset global state if needed
          window.location.reload();
        }
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}

// Convenience components for different levels
export const AppErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary level="app">{children}</ErrorBoundary>
);

export const PageErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary level="page">{children}</ErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary level="component">{children}</ErrorBoundary>
);

export default ErrorBoundary;