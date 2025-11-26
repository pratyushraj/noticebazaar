/**
 * Centralized logging utility for NoticeBazaar
 * Provides consistent logging across the application with environment-aware output
 */

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private isProduction = import.meta.env.PROD;

  /**
   * Log informational messages (only in development)
   */
  info(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(`[${LogLevel.INFO}] ${message}`, context || '');
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext) {
    console.warn(`[${LogLevel.WARN}] ${message}`, context || '');
  }

  /**
   * Log error messages (always logged, can be sent to error tracking service)
   */
  error(message: string, error?: any, context?: LogContext) {
    console.error(`[${LogLevel.ERROR}] ${message}`, {
      error: error?.message || error,
      stack: error?.stack,
      ...context,
    });

    // In production, you could send to error tracking service like Sentry
    if (this.isProduction) {
      // TODO: Integrate with error tracking service
      // Sentry.captureException(error, { extra: context });
    }
  }

  /**
   * Log debug messages (only in development)
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.debug(`[${LogLevel.DEBUG}] ${message}`, context || '');
    }
  }

  /**
   * Log a success message
   */
  success(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(`[SUCCESS] ✅ ${message}`, context || '');
    }
  }

  /**
   * Group related logs together
   */
  group(label: string, callback: () => void) {
    if (this.isDevelopment) {
      console.group(label);
      callback();
      console.groupEnd();
    } else {
      callback();
    }
  }

  /**
   * Time a function execution
   */
  time(label: string) {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string) {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }

  /**
   * Log API calls
   */
  api(method: string, endpoint: string, status?: number, duration?: number) {
    if (this.isDevelopment) {
      const statusColor = status && status >= 400 ? '🔴' : '🟢';
      console.log(
        `${statusColor} [API] ${method} ${endpoint}`,
        status ? `Status: ${status}` : '',
        duration ? `Duration: ${duration}ms` : ''
      );
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export as default for convenience
export default logger;

