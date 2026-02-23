/**
 * Debug Logger Utility
 *
 * Logger ini hanya menampilkan log di environment development
 * Di production, semua log akan di-disable untuk performance
 *
 * Usage:
 * import { debugLogger } from '@/utils/debugLogger'
 *
 * debugLogger.log('Message', data)
 * debugLogger.warn('Warning message', data)
 * debugLogger.error('Error message', error)
 * debugLogger.info('Info message', data)
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error';
type LogContext = string;

interface DebugLogger {
  log: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  group: (label: string) => void;
  groupEnd: () => void;
  time: (label: string) => void;
  timeEnd: (label: string) => void;
  /**
   * Create a context-specific logger
   * @param context - Context name for the logger (e.g., 'Auth', 'API', 'Component')
   * @returns A logger with context prefix
   */
  withContext: (context: LogContext) => DebugLogger;
}

const isDevelopment = process.env.NODE_ENV === 'development';

// Color codes for different log levels
const colors = {
  log: '#0066cc',    // Blue
  info: '#009933',   // Green
  warn: '#ff6600',   // Orange
  error: '#cc0000',  // Red
};

const formatMessage = (level: LogLevel, context: LogContext | null, message: string): string => {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
  const prefix = context ? `[${context}]` : '';
  return `${timestamp} ${prefix} ${message}`;
};

const createLogger = (context: LogContext | null = null): DebugLogger => {
  return {
    log: (message: string, ...args: unknown[]) => {
      if (isDevelopment) {
        const formattedMessage = formatMessage('log', context, message);
        console.log(`%c${formattedMessage}`, `color: ${colors.log}`, ...args);
      }
    },

    info: (message: string, ...args: unknown[]) => {
      if (isDevelopment) {
        const formattedMessage = formatMessage('info', context, message);
        console.info(`%c${formattedMessage}`, `color: ${colors.info}`, ...args);
      }
    },

    warn: (message: string, ...args: unknown[]) => {
      if (isDevelopment) {
        const formattedMessage = formatMessage('warn', context, message);
        console.warn(`%c${formattedMessage}`, `color: ${colors.warn}`, ...args);
      }
    },

    error: (message: string, ...args: unknown[]) => {
      // Error selalu ditampilkan di semua environment
      const formattedMessage = formatMessage('error', context, message);
      console.error(`%c${formattedMessage}`, `color: ${colors.error}`, ...args);
    },

    group: (label: string) => {
      if (isDevelopment) {
        console.group(`%c${label}`, `color: ${colors.log}; font-weight: bold`);
      }
    },

    groupEnd: () => {
      if (isDevelopment) {
        console.groupEnd();
      }
    },

    time: (label: string) => {
      if (isDevelopment) {
        console.time(label);
      }
    },

    timeEnd: (label: string) => {
      if (isDevelopment) {
        console.timeEnd(label);
      }
    },

    withContext: (newContext: LogContext) => {
      return createLogger(newContext);
    },
  };
};

// Export default logger and context-specific creators
export const debugLogger = createLogger();

/**
 * Create a logger with a specific context
 * @param context - Context name (e.g., 'Auth', 'API', 'Component')
 * @returns A debug logger instance with context prefix
 */
export const createDebugLogger = (context: LogContext): DebugLogger => {
  return createLogger(context);
};

// Pre-defined loggers for common contexts
export const authLogger = createDebugLogger('Auth');
export const apiLogger = createDebugLogger('API');
export const componentLogger = createDebugLogger('Component');
export const utilsLogger = createDebugLogger('Utils');
export const storageLogger = createDebugLogger('Storage');

// Export default
export default debugLogger;
