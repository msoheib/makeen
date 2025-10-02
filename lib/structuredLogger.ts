/**
 * Centralized logging utility for tenant creation and auth state changes
 * Provides structured logging with different levels and contexts
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  action: string;
  message: string;
  userId?: string;
  metadata?: Record<string, any>;
  duration?: number;
}

export interface LogContext {
  component: string;
  userId?: string;
  sessionId?: string;
  action: string;
}

const ENABLE_CONSOLE_OUTPUT = false;

class StructuredLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  private createLogEntry(
    level: LogLevel,
    context: string,
    action: string,
    message: string,
    metadata?: Record<string, any>,
    userId?: string
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      context,
      action,
      message,
      userId,
      metadata,
    };
  }

  private log(level: LogLevel, context: string, action: string, message: string, metadata?: Record<string, any>) {
    const entry = this.createLogEntry(level, context, action, message, metadata);

    // Add to memory logs
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with formatting
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${context}:${action}]`;
    const userIdSuffix = entry.userId ? ` [User:${entry.userId}]` : '';
    const consoleMessage = `${prefix}${userIdSuffix} ${message}`;

    if (ENABLE_CONSOLE_OUTPUT) {
      switch (level) {
        case 'debug':
          console.debug(consoleMessage, metadata || '');
          break;
        case 'info':
          console.info(consoleMessage, metadata || '');
          break;
        case 'warn':
          console.warn(consoleMessage, metadata || '');
          break;
        case 'error':
          console.error(consoleMessage, metadata || '');
          break;
      }
    }

    // In production, you might want to send logs to a service
    // this.sendToLogService(entry);
  }

  debug(context: string, action: string, message: string, metadata?: Record<string, any>) {
    this.log('debug', context, action, message, metadata);
  }

  info(context: string, action: string, message: string, metadata?: Record<string, any>) {
    this.log('info', context, action, message, metadata);
  }

  warn(context: string, action: string, message: string, metadata?: Record<string, any>) {
    this.log('warn', context, action, message, metadata);
  }

  error(context: string, action: string, message: string, metadata?: Record<string, any>) {
    this.log('error', context, action, message, metadata);
  }

  // Context-specific logging methods
  logAuthStateChange(userId: string, fromState: string, toState: string, metadata?: Record<string, any>) {
    this.info('auth', 'state_change', `Auth state changed from ${fromState} to ${toState}`, {
      fromState,
      toState,
      ...metadata,
    }, userId);
  }

  logTenantCreationStart(userId: string, email: string, role: string, metadata?: Record<string, any>) {
    this.info('tenant', 'creation_start', `Starting tenant creation for ${email}`, {
      email,
      role,
      ...metadata,
    }, userId);
  }

  logTenantCreationSuccess(userId: string, email: string, duration: number, metadata?: Record<string, any>) {
    this.info('tenant', 'creation_success', `Tenant created successfully for ${email}`, {
      email,
      duration,
      ...metadata,
    }, userId);
  }

  logTenantCreationError(userId: string | undefined, email: string, error: string, metadata?: Record<string, any>) {
    this.error('tenant', 'creation_error', `Failed to create tenant for ${email}: ${error}`, {
      email,
      error,
      ...metadata,
    }, userId);
  }

  logProfileOperation(userId: string, operation: string, success: boolean, metadata?: Record<string, any>) {
    const level = success ? 'info' : 'error';
    const message = success ? `Profile ${operation} successful` : `Profile ${operation} failed`;

    this.log(level, 'profile', operation, message, {
      operation,
      success,
      ...metadata,
    }, userId);
  }

  logSecurityEvent(userId: string, eventType: string, description: string, metadata?: Record<string, any>) {
    this.warn('security', eventType, description, {
      eventType,
      ...metadata,
    }, userId);
  }

  logApiCall(userId: string, endpoint: string, method: string, duration: number, statusCode: number, metadata?: Record<string, any>) {
    this.debug('api', 'call', `${method} ${endpoint} - ${statusCode} (${duration}ms)`, {
      endpoint,
      method,
      duration,
      statusCode,
      ...metadata,
    }, userId);
  }

  logPermissionCheck(userId: string, resource: string, action: string, granted: boolean, metadata?: Record<string, any>) {
    this.debug('permissions', 'check', `${action} on ${resource} - ${granted ? 'granted' : 'denied'}`, {
      resource,
      action,
      granted,
      ...metadata,
    }, userId);
  }

  // Performance monitoring
  logPerformance(context: string, action: string, duration: number, metadata?: Record<string, any>) {
    if (duration > 1000) { // Log slow operations as warnings
      this.warn('performance', 'slow_operation', `${context}:${action} took ${duration}ms`, {
        context,
        action,
        duration,
        threshold: 1000,
        ...metadata,
      });
    } else {
      this.debug('performance', 'operation', `${context}:${action} completed in ${duration}ms`, {
        context,
        action,
        duration,
        ...metadata,
      });
    }
  }

  // Get logs for analysis
  getLogs(level?: LogLevel, context?: string, limit = 100): LogEntry[] {
    let filteredLogs = this.logs;

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    if (context) {
      filteredLogs = filteredLogs.filter(log => log.context === context);
    }

    return filteredLogs.slice(-limit);
  }

  // Get recent errors for debugging
  getRecentErrors(limit = 50): LogEntry[] {
    return this.getLogs('error', undefined, limit);
  }

  // Get performance metrics
  getPerformanceMetrics(context?: string) {
    const perfLogs = this.getLogs('debug', 'performance', 1000);
    const relevantLogs = context ? perfLogs.filter(log => log.metadata?.context === context) : perfLogs;

    return {
      totalOperations: relevantLogs.length,
      averageDuration: relevantLogs.reduce((sum, log) => sum + (log.metadata?.duration || 0), 0) / relevantLogs.length || 0,
      slowOperations: relevantLogs.filter(log => (log.metadata?.duration || 0) > 1000).length,
      operationsByContext: relevantLogs.reduce((acc, log) => {
        const ctx = log.metadata?.context || 'unknown';
        acc[ctx] = (acc[ctx] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  // Clear logs (useful for testing)
  clearLogs() {
    this.logs = [];
  }

  // Export logs for debugging
  exportLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Get logs by user session
  getUserSessionLogs(userId: string, limit = 100): LogEntry[] {
    return this.logs
      .filter(log => log.userId === userId)
      .slice(-limit);
  }
}

// Export singleton instance
export const logger = new StructuredLogger();

// Export convenience functions for direct usage
export const logAuthStateChange = (userId: string, fromState: string, toState: string, metadata?: Record<string, any>) =>
  logger.logAuthStateChange(userId, fromState, toState, metadata);

export const logTenantCreation = {
  start: (userId: string, email: string, role: string, metadata?: Record<string, any>) =>
    logger.logTenantCreationStart(userId, email, role, metadata),
  success: (userId: string, email: string, duration: number, metadata?: Record<string, any>) =>
    logger.logTenantCreationSuccess(userId, email, duration, metadata),
  error: (userId: string | undefined, email: string, error: string, metadata?: Record<string, any>) =>
    logger.logTenantCreationError(userId, email, error, metadata),
};

export const logProfileOperation = (userId: string, operation: string, success: boolean, metadata?: Record<string, any>) =>
  logger.logProfileOperation(userId, operation, success, metadata);

export const logSecurityEvent = (userId: string, eventType: string, description: string, metadata?: Record<string, any>) =>
  logger.logSecurityEvent(userId, eventType, description, metadata);

export const logApiCall = (userId: string, endpoint: string, method: string, duration: number, statusCode: number, metadata?: Record<string, any>) =>
  logger.logApiCall(userId, endpoint, method, duration, statusCode, metadata);

export const logPermissionCheck = (userId: string, resource: string, action: string, granted: boolean, metadata?: Record<string, any>) =>
  logger.logPermissionCheck(userId, resource, action, granted, metadata);

// Performance monitoring helper
export function withPerformanceLogging<T>(
  context: string,
  action: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = Date.now();

  return fn()
    .then(result => {
      const duration = Date.now() - startTime;
      logger.logPerformance(context, action, duration, metadata);
      return result;
    })
    .catch(error => {
      const duration = Date.now() - startTime;
      logger.error('performance', 'operation_failed', `${context}:${action} failed after ${duration}ms`, {
        context,
        action,
        duration,
        error: error.message,
        ...metadata,
      });
      throw error;
    });
}

// Authentication state monitoring helper
export function monitorAuthStateChanges(
  userId: string,
  getCurrentState: () => string,
  onChange: (oldState: string, newState: string) => void
) {
  let lastState = getCurrentState();

  const checkState = () => {
    const currentState = getCurrentState();
    if (currentState !== lastState) {
      logAuthStateChange(userId, lastState, currentState);
      onChange(lastState, currentState);
      lastState = currentState;
    }
  };

  // Check state every second
  const interval = setInterval(checkState, 1000);

  // Return cleanup function
  return () => clearInterval(interval);
}
