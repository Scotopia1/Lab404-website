interface ErrorReport {
  id: string;
  timestamp: Date;
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  userId?: string;
  level: 'error' | 'warning' | 'info';
  context?: Record<string, any>;
  tags?: string[];
}

interface PerformanceMetric {
  id: string;
  timestamp: Date;
  name: string;
  value: number;
  unit: string;
  context?: Record<string, any>;
}

interface UserSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  pageViews: number;
  errors: number;
  warnings: number;
  userAgent: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

class ErrorTrackingService {
  private errors: ErrorReport[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private currentSession: UserSession;
  private isEnabled: boolean = true;
  private maxStoredErrors = 100;
  private maxStoredMetrics = 100;

  constructor() {
    this.currentSession = this.createNewSession();
    this.initializeErrorTracking();
    this.initializePerformanceTracking();
  }

  private createNewSession(): UserSession {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      id: this.generateId(),
      startTime: new Date(),
      pageViews: 1,
      errors: 0,
      warnings: 0,
      userAgent: navigator.userAgent,
      referrer: document.referrer || undefined,
      utmSource: urlParams.get('utm_source') || undefined,
      utmMedium: urlParams.get('utm_medium') || undefined,
      utmCampaign: urlParams.get('utm_campaign') || undefined,
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeErrorTracking(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        level: 'error',
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          type: 'javascript'
        }
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        level: 'error',
        context: {
          type: 'promise_rejection',
          reason: event.reason
        }
      });
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      const target = event.target as HTMLElement;
      if (target && target !== window) {
        this.captureError({
          message: `Resource failed to load: ${target.tagName}`,
          level: 'error',
          context: {
            type: 'resource_error',
            tagName: target.tagName,
            src: (target as any).src || (target as any).href,
          }
        });
      }
    }, true);
  }

  private initializePerformanceTracking(): void {
    // Core Web Vitals tracking
    if ('PerformanceObserver' in window) {
      // First Contentful Paint (FCP)
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.capturePerformanceMetric({
            name: 'first_contentful_paint',
            value: entry.startTime,
            unit: 'ms',
            context: { type: 'core_web_vital' }
          });
        }
      }).observe({ type: 'paint', buffered: true });

      // Largest Contentful Paint (LCP)
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.capturePerformanceMetric({
            name: 'largest_contentful_paint',
            value: entry.startTime,
            unit: 'ms',
            context: { 
              type: 'core_web_vital',
              element: entry.element?.tagName
            }
          });
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      // First Input Delay (FID)
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.capturePerformanceMetric({
            name: 'first_input_delay',
            value: entry.processingStart - entry.startTime,
            unit: 'ms',
            context: { 
              type: 'core_web_vital',
              name: entry.name
            }
          });
        }
      }).observe({ type: 'first-input', buffered: true });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.capturePerformanceMetric({
          name: 'cumulative_layout_shift',
          value: clsValue,
          unit: 'score',
          context: { type: 'core_web_vital' }
        });
      }).observe({ type: 'layout-shift', buffered: true });
    }

    // Navigation timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.capturePerformanceMetric({
            name: 'page_load_time',
            value: navigation.loadEventEnd - navigation.navigationStart,
            unit: 'ms',
            context: { type: 'navigation' }
          });

          this.capturePerformanceMetric({
            name: 'dom_content_loaded',
            value: navigation.domContentLoadedEventEnd - navigation.navigationStart,
            unit: 'ms',
            context: { type: 'navigation' }
          });
        }
      }, 0);
    });
  }

  public captureError(error: Partial<ErrorReport>): void {
    if (!this.isEnabled) return;

    const errorReport: ErrorReport = {
      id: this.generateId(),
      timestamp: new Date(),
      message: error.message || 'Unknown error',
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      level: error.level || 'error',
      context: error.context,
      tags: error.tags,
      ...error
    };

    this.errors.push(errorReport);
    
    // Update session counters
    if (errorReport.level === 'error') {
      this.currentSession.errors++;
    } else if (errorReport.level === 'warning') {
      this.currentSession.warnings++;
    }

    // Keep only recent errors
    if (this.errors.length > this.maxStoredErrors) {
      this.errors = this.errors.slice(-this.maxStoredErrors);
    }

    // Console logging in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 ${errorReport.level.toUpperCase()}: ${errorReport.message}`);
      console.log('Timestamp:', errorReport.timestamp);
      console.log('URL:', errorReport.url);
      if (errorReport.stack) console.log('Stack:', errorReport.stack);
      if (errorReport.context) console.log('Context:', errorReport.context);
      console.groupEnd();
    }

    // In production, you would send this to your error tracking service
    // Example: this.sendErrorToService(errorReport);
  }

  public capturePerformanceMetric(metric: Partial<PerformanceMetric>): void {
    if (!this.isEnabled) return;

    const performanceMetric: PerformanceMetric = {
      id: this.generateId(),
      timestamp: new Date(),
      name: metric.name || 'unknown_metric',
      value: metric.value || 0,
      unit: metric.unit || 'ms',
      context: metric.context,
      ...metric
    };

    this.performanceMetrics.push(performanceMetric);

    // Keep only recent metrics
    if (this.performanceMetrics.length > this.maxStoredMetrics) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxStoredMetrics);
    }

    // Console logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Performance: ${performanceMetric.name} = ${performanceMetric.value}${performanceMetric.unit}`);
    }
  }

  public captureUserAction(action: string, context?: Record<string, any>): void {
    this.capturePerformanceMetric({
      name: 'user_action',
      value: Date.now(),
      unit: 'timestamp',
      context: {
        action,
        ...context
      }
    });
  }

  public setUser(userId: string): void {
    // Update all future errors with user ID
    this.errors.forEach(error => {
      if (!error.userId) error.userId = userId;
    });
  }

  public addTag(tag: string): void {
    // Add tag to current session context
    if (!this.currentSession.userAgent.includes(tag)) {
      this.currentSession.userAgent += ` [${tag}]`;
    }
  }

  public getErrorSummary(): {
    totalErrors: number;
    totalWarnings: number;
    recentErrors: ErrorReport[];
    topErrorMessages: { message: string; count: number }[];
  } {
    const recentErrors = this.errors.slice(-10);
    const errorCounts = this.errors.reduce((acc, error) => {
      acc[error.message] = (acc[error.message] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topErrorMessages = Object.entries(errorCounts)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalErrors: this.errors.filter(e => e.level === 'error').length,
      totalWarnings: this.errors.filter(e => e.level === 'warning').length,
      recentErrors,
      topErrorMessages
    };
  }

  public getPerformanceSummary(): {
    coreWebVitals: Record<string, number>;
    navigationTiming: Record<string, number>;
    recentMetrics: PerformanceMetric[];
  } {
    const coreWebVitals = this.performanceMetrics
      .filter(m => m.context?.type === 'core_web_vital')
      .reduce((acc, metric) => {
        acc[metric.name] = metric.value;
        return acc;
      }, {} as Record<string, number>);

    const navigationTiming = this.performanceMetrics
      .filter(m => m.context?.type === 'navigation')
      .reduce((acc, metric) => {
        acc[metric.name] = metric.value;
        return acc;
      }, {} as Record<string, number>);

    return {
      coreWebVitals,
      navigationTiming,
      recentMetrics: this.performanceMetrics.slice(-10)
    };
  }

  public getCurrentSession(): UserSession {
    return { ...this.currentSession };
  }

  public endSession(): void {
    this.currentSession.endTime = new Date();
    
    // In production, send session data to analytics service
    if (process.env.NODE_ENV === 'development') {
      console.log('📈 Session ended:', this.currentSession);
    }
  }

  public disable(): void {
    this.isEnabled = false;
  }

  public enable(): void {
    this.isEnabled = true;
  }

  // Method to export data for external services
  public exportData(): {
    errors: ErrorReport[];
    metrics: PerformanceMetric[];
    session: UserSession;
  } {
    return {
      errors: [...this.errors],
      metrics: [...this.performanceMetrics],
      session: { ...this.currentSession }
    };
  }
}

// Create singleton instance
export const errorTracker = new ErrorTrackingService();

// React hook for error tracking
export const useErrorTracking = () => {
  const captureError = (error: Error | string, context?: Record<string, any>) => {
    const errorData: Partial<ErrorReport> = typeof error === 'string'
      ? { message: error, context }
      : { message: error.message, stack: error.stack, context };

    errorTracker.captureError(errorData);
  };

  const captureWarning = (message: string, context?: Record<string, any>) => {
    errorTracker.captureError({
      message,
      level: 'warning',
      context
    });
  };

  const captureUserAction = (action: string, context?: Record<string, any>) => {
    errorTracker.captureUserAction(action, context);
  };

  const measurePerformance = (name: string, fn: () => void | Promise<void>) => {
    const startTime = performance.now();
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - startTime;
        errorTracker.capturePerformanceMetric({
          name,
          value: duration,
          unit: 'ms'
        });
      });
    } else {
      const duration = performance.now() - startTime;
      errorTracker.capturePerformanceMetric({
        name,
        value: duration,
        unit: 'ms'
      });
      return result;
    }
  };

  return {
    captureError,
    captureWarning,
    captureUserAction,
    measurePerformance,
    getErrorSummary: () => errorTracker.getErrorSummary(),
    getPerformanceSummary: () => errorTracker.getPerformanceSummary()
  };
};

export default errorTracker;