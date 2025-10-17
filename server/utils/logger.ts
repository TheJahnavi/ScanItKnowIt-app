import fs from 'fs';
import path from 'path';
import { sanitizeLogData } from './sanitize.js';

// Define log levels
type LogLevel = 'error' | 'warn' | 'info' | 'debug';

// Define log entry structure
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: any;
}

class Logger {
  private logFilePath: string;
  private logToConsole: boolean;
  private logToFile: boolean;

  constructor() {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    this.logFilePath = path.join(logsDir, 'application.log');
    this.logToConsole = process.env.LOG_TO_CONSOLE !== 'false';
    this.logToFile = process.env.LOG_TO_FILE === 'true';
  }

  private formatLogEntry(level: LogLevel, message: string, meta?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta: meta ? sanitizeLogData(meta) : undefined
    };
  }

  private writeLog(entry: LogEntry): void {
    const logString = JSON.stringify(entry);

    // Log to console if enabled
    if (this.logToConsole) {
      const consoleMethods: Record<LogLevel, (message: string) => void> = {
        error: console.error,
        warn: console.warn,
        info: console.info,
        debug: console.debug
      };
      
      // Add color coding for different log levels in development
      if (process.env.NODE_ENV !== 'production') {
        const colors: Record<LogLevel, string> = {
          error: '\x1b[31m', // Red
          warn: '\x1b[33m',  // Yellow
          info: '\x1b[36m',  // Cyan
          debug: '\x1b[90m'  // Gray
        };
        const reset = '\x1b[0m';
        consoleMethods[entry.level](`${colors[entry.level]}[${entry.timestamp}] ${entry.message}${reset}`);
      } else {
        consoleMethods[entry.level](`[${entry.timestamp}] ${entry.message}`);
      }
    }

    // Log to file if enabled
    if (this.logToFile) {
      try {
        fs.appendFileSync(this.logFilePath, logString + '\n');
      } catch (error) {
        console.error('Failed to write to log file:', error);
      }
    }
  }

  error(message: string, meta?: any): void {
    const entry = this.formatLogEntry('error', message, meta);
    this.writeLog(entry);
  }

  warn(message: string, meta?: any): void {
    const entry = this.formatLogEntry('warn', message, meta);
    this.writeLog(entry);
  }

  info(message: string, meta?: any): void {
    const entry = this.formatLogEntry('info', message, meta);
    this.writeLog(entry);
  }

  debug(message: string, meta?: any): void {
    // Only log debug messages in development
    if (process.env.NODE_ENV === 'development') {
      const entry = this.formatLogEntry('debug', message, meta);
      this.writeLog(entry);
    }
  }

  // Specialized logging methods for common operations
  logApiRequest(method: string, url: string, statusCode: number, duration: number): void {
    this.info(`API Request: ${method} ${url} ${statusCode} (${duration}ms)`);
  }

  logApiError(method: string, url: string, error: any): void {
    this.error(`API Error: ${method} ${url}`, { error: error.message || error });
  }

  logDatabaseOperation(operation: string, table: string, duration: number): void {
    this.info(`Database Operation: ${operation} on ${table} (${duration}ms)`);
  }

  logExternalApiCall(service: string, endpoint: string, duration: number): void {
    this.info(`External API Call: ${service} ${endpoint} (${duration}ms)`);
  }

  logRateLimitExceeded(ip: string, endpoint: string): void {
    this.warn(`Rate Limit Exceeded: IP ${ip} on ${endpoint}`);
  }
}

// Export a singleton instance
export const logger = new Logger();

// Export the Logger class for potential custom instances
export default Logger;