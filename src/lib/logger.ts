// Simple frontend logger utility
interface LogLevel {
  DEBUG: number;
  INFO: number;
  WARN: number;
  ERROR: number;
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  private currentLevel: number;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV || false;
    this.currentLevel = this.isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;
  }

  private formatMessage(level: string, message: string, data?: any): void {
    if (!this.isDevelopment) {
      // In production, only log warnings and errors
      if (level === 'ERROR' || level === 'WARN') {
        console[level.toLowerCase() as keyof Console](`[${level}] ${message}`, data || '');
      }
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;

    if (data !== undefined) {
      console[level.toLowerCase() as keyof Console](`${prefix} ${message}`, data);
    } else {
      console[level.toLowerCase() as keyof Console](`${prefix} ${message}`);
    }
  }

  debug(message: string, data?: any): void {
    if (this.currentLevel <= LOG_LEVELS.DEBUG) {
      this.formatMessage('DEBUG', message, data);
    }
  }

  info(message: string, data?: any): void {
    if (this.currentLevel <= LOG_LEVELS.INFO) {
      this.formatMessage('INFO', message, data);
    }
  }

  warn(message: string, data?: any): void {
    if (this.currentLevel <= LOG_LEVELS.WARN) {
      this.formatMessage('WARN', message, data);
    }
  }

  error(message: string, data?: any): void {
    if (this.currentLevel <= LOG_LEVELS.ERROR) {
      this.formatMessage('ERROR', message, data);

      // In production, you might want to send errors to an error tracking service
      // Example: Sentry, LogRocket, etc.
      if (!this.isDevelopment && window && (window as any).errorTracker) {
        try {
          (window as any).errorTracker.captureException(new Error(message), data);
        } catch (err) {
          // Silently fail if error tracking is not available
        }
      }
    }
  }

  setLevel(level: keyof LogLevel): void {
    this.currentLevel = LOG_LEVELS[level];
  }
}

// Export singleton instance
export const logger = new Logger();

// Export the class for testing or custom instances
export { Logger };