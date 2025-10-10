import { toast } from 'sonner';
import type { AppError } from './types';

/**
 * Enhanced error handling utility for LAB404 e-commerce platform
 */

// Error types enum for categorization
export enum ErrorType {
  NETWORK = 'NETWORK_ERROR',
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  SERVER = 'SERVER_ERROR',
  CLIENT = 'CLIENT_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  productId?: string;
  additionalInfo?: Record<string, any>;
}

export class AppErrorHandler {
  private static instance: AppErrorHandler;
  
  static getInstance(): AppErrorHandler {
    if (!AppErrorHandler.instance) {
      AppErrorHandler.instance = new AppErrorHandler();
    }
    return AppErrorHandler.instance;
  }

  /**
   * Create a standardized error object
   */
  createError(
    message: string, 
    type: ErrorType = ErrorType.UNKNOWN,
    context?: ErrorContext,
    originalError?: Error
  ): AppError {
    return {
      message,
      code: type,
      stack: originalError?.stack,
      context,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Handle errors with appropriate user feedback and logging
   */
  handleError(
    error: Error | AppError | unknown, 
    context?: ErrorContext,
    showToast: boolean = true
  ): AppError {
    let processedError: AppError;

    // Convert unknown errors to AppError format
    if (error instanceof Error) {
      processedError = this.createError(
        error.message,
        this.categorizeError(error),
        context,
        error
      );
    } else if (this.isAppError(error)) {
      processedError = error;
    } else {
      processedError = this.createError(
        'An unexpected error occurred',
        ErrorType.UNKNOWN,
        context
      );
    }

    // Log error
    this.logError(processedError);

    // Show user-friendly notification
    if (showToast) {
      this.showErrorToast(processedError);
    }

    // Track error in production (for analytics)
    if (import.meta.env.PROD) {
      this.trackError(processedError);
    }

    return processedError;
  }

  /**
   * Categorize error based on error type or message
   */
  private categorizeError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    
    if (error.name === 'TypeError' && message.includes('fetch')) {
      return ErrorType.NETWORK;
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }
    
    if (message.includes('unauthorized') || message.includes('auth')) {
      return ErrorType.AUTHENTICATION;
    }
    
    if (message.includes('forbidden') || message.includes('permission')) {
      return ErrorType.AUTHORIZATION;
    }
    
    if (message.includes('not found') || message.includes('404')) {
      return ErrorType.NOT_FOUND;
    }
    
    if (message.includes('server') || message.includes('500')) {
      return ErrorType.SERVER;
    }
    
    return ErrorType.CLIENT;
  }

  /**
   * Type guard to check if error is AppError
   */
  private isAppError(error: unknown): error is AppError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      'timestamp' in error
    );
  }

  /**
   * Log error to console and external services
   */
  private logError(error: AppError): void {
    const logData = {
      ...error,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: error.timestamp,
    };

    if (import.meta.env.DEV) {
      console.group('🚨 Error Handler');
      console.error('Error:', error.message);
      console.error('Type:', error.code);
      console.error('Context:', error.context);
      console.error('Stack:', error.stack);
      console.groupEnd();
    }

    // In production, send to error tracking service
    if (import.meta.env.PROD) {
      // This would integrate with Sentry, LogRocket, etc.
      this.sendToErrorTracking(logData);
    }
  }

  /**
   * Show user-friendly error toast
   */
  private showErrorToast(error: AppError): void {
    const userMessage = this.getUserFriendlyMessage(error);
    
    switch (error.code) {
      case ErrorType.NETWORK:
        toast.error('Connection Issue', {
          description: userMessage,
          action: {
            label: 'Retry',
            onClick: () => window.location.reload(),
          },
        });
        break;
        
      case ErrorType.AUTHENTICATION:
        toast.error('Authentication Required', {
          description: userMessage,
          action: {
            label: 'Login',
            onClick: () => window.location.href = '/login',
          },
        });
        break;
        
      case ErrorType.VALIDATION:
        toast.error('Invalid Input', {
          description: userMessage,
        });
        break;
        
      case ErrorType.NOT_FOUND:
        toast.error('Not Found', {
          description: userMessage,
        });
        break;
        
      default:
        toast.error('Something went wrong', {
          description: userMessage,
        });
    }
  }

  /**
   * Convert technical error to user-friendly message
   */
  private getUserFriendlyMessage(error: AppError): string {
    switch (error.code) {
      case ErrorType.NETWORK:
        return 'Please check your internet connection and try again.';
      case ErrorType.AUTHENTICATION:
        return 'Please log in to continue.';
      case ErrorType.AUTHORIZATION:
        return 'You don\'t have permission to perform this action.';
      case ErrorType.VALIDATION:
        return 'Please check your input and try again.';
      case ErrorType.NOT_FOUND:
        return 'The requested item could not be found.';
      case ErrorType.SERVER:
        return 'Our servers are experiencing issues. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Send error to tracking service (Sentry, LogRocket, etc.)
   */
  private sendToErrorTracking(errorData: any): void {
    // This would integrate with your error tracking service
    // Example: Sentry.captureException(errorData)
    console.log('Would send to error tracking:', errorData);
  }

  /**
   * Track error for analytics
   */
  private trackError(error: AppError): void {
    // This would integrate with your analytics service
    // Example: analytics.track('error_occurred', { error_type: error.code })
    console.log('Would track error:', error.code);
  }

  /**
   * Get error severity level
   */
  getErrorSeverity(error: AppError): ErrorSeverity {
    switch (error.code) {
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
        return ErrorSeverity.HIGH;
      case ErrorType.SERVER:
        return ErrorSeverity.CRITICAL;
      case ErrorType.NETWORK:
        return ErrorSeverity.MEDIUM;
      case ErrorType.VALIDATION:
      case ErrorType.CLIENT:
        return ErrorSeverity.LOW;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }
}

// Singleton instance
export const errorHandler = AppErrorHandler.getInstance();

// Convenience functions for common error types
export const handleNetworkError = (error: Error, context?: ErrorContext) => {
  return errorHandler.handleError(error, context);
};

export const handleValidationError = (message: string, context?: ErrorContext) => {
  const error = errorHandler.createError(message, ErrorType.VALIDATION, context);
  return errorHandler.handleError(error, context);
};

export const handleAuthError = (message: string = 'Authentication required', context?: ErrorContext) => {
  const error = errorHandler.createError(message, ErrorType.AUTHENTICATION, context);
  return errorHandler.handleError(error, context);
};

export const handleNotFoundError = (resource: string = 'Resource', context?: ErrorContext) => {
  const error = errorHandler.createError(`${resource} not found`, ErrorType.NOT_FOUND, context);
  return errorHandler.handleError(error, context);
};

/**
 * React hook for handling async errors
 */
export const useErrorHandler = () => {
  return {
    handleError: (error: unknown, context?: ErrorContext) => 
      errorHandler.handleError(error, context),
    handleAsyncError: async <T>(
      asyncFn: () => Promise<T>,
      context?: ErrorContext
    ): Promise<T | null> => {
      try {
        return await asyncFn();
      } catch (error) {
        errorHandler.handleError(error, context);
        return null;
      }
    },
  };
};

/**
 * Error boundary hook for React components
 */
export const useErrorBoundary = () => {
  return {
    captureError: (error: Error, context?: ErrorContext) => {
      errorHandler.handleError(error, context, false); // Don't show toast in error boundary
    },
  };
};

/**
 * Global error handlers for unhandled errors
 */
export const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    errorHandler.handleError(
      event.reason,
      { component: 'global', action: 'unhandled_promise_rejection' }
    );
    event.preventDefault();
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
    errorHandler.handleError(
      event.error,
      { 
        component: 'global', 
        action: 'uncaught_error',
        additionalInfo: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      }
    );
  });
};

// API Error Handler for fetch requests
export const createApiErrorHandler = (baseURL: string = '') => {
  return async (response: Response) => {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorType = ErrorType.SERVER;
      
      // Try to get error details from response body
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Use default error message if response body is not JSON
      }
      
      // Categorize HTTP errors
      if (response.status >= 400 && response.status < 500) {
        errorType = response.status === 401 
          ? ErrorType.AUTHENTICATION 
          : response.status === 403
          ? ErrorType.AUTHORIZATION
          : response.status === 404
          ? ErrorType.NOT_FOUND
          : ErrorType.CLIENT;
      }
      
      const error = errorHandler.createError(
        errorMessage,
        errorType,
        { 
          action: 'api_request',
          additionalInfo: { 
            url: response.url,
            status: response.status,
            statusText: response.statusText,
          }
        }
      );
      
      throw error;
    }
    
    return response;
  };
};

export default errorHandler;