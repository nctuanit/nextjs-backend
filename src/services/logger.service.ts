import { Injectable } from '../di/injectable.decorator';

export interface LoggerService {
  log(message: unknown, context?: string): void;
  error(message: unknown, trace?: string, context?: string): void;
  warn(message: unknown, context?: string): void;
  debug?(message: unknown, context?: string): void;
  verbose?(message: unknown, context?: string): void;
}

export type LogLevel = 'log' | 'error' | 'warn' | 'debug' | 'verbose';

@Injectable()
export class ConsoleLogger implements LoggerService {
  private static lastTimestamp = Date.now();
  private static readonly colors: Record<string, string> = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
  };
  protected context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: unknown, context?: string) {
    this.printMessage(message, 'green', context || this.context, 'LOG');
  }

  error(message: unknown, trace?: string, context?: string) {
    this.printMessage(message, 'red', context || this.context, 'ERROR');
    if (trace) {
      console.error(trace);
    }
  }

  warn(message: unknown, context?: string) {
    this.printMessage(message, 'yellow', context || this.context, 'WARN');
  }

  debug(message: unknown, context?: string) {
    this.printMessage(message, 'magenta', context || this.context, 'DEBUG');
  }

  verbose(message: unknown, context?: string) {
    this.printMessage(message, 'cyan', context || this.context, 'VERBOSE');
  }

  protected printMessage(message: unknown, color: string, context: string = '', level: string) {
    const output = typeof message === 'object' ? JSON.stringify(message, null, 2) : message;
    const pid = process.pid;
    const timestamp = new Date().toLocaleString();
    const contextString = context ? `[${context}] ` : '';
    
    // Time diff
    const currentTimestamp = Date.now();
    const diff = currentTimestamp - ConsoleLogger.lastTimestamp;
    ConsoleLogger.lastTimestamp = currentTimestamp;
    
    // Formatting with basic ANSI colors for console
    const c = ConsoleLogger.colors;

    const cLevel = `${c[color]}[Next.js-Backend] ${pid}  - \x1b[0m`;
    const cTimestamp = `${timestamp}     `;
    const cContext = `\x1b[33m${contextString}\x1b[0m`;
    const cMessage = `${c[color]}${output}\x1b[0m`;
    const cDiff = `\x1b[33m+${diff}ms\x1b[0m`;

    console.log(`${cLevel}${cTimestamp}${level} ${cContext}${cMessage} ${cDiff}`);
  }
}

/**
 * A static wrapper around the default logger for use outside of DI context.
 */
export class Logger {
  private static staticInstance: LoggerService = new ConsoleLogger();
  private instanceLogger: LoggerService;

  constructor(context?: string) {
    this.instanceLogger = new ConsoleLogger(context);
  }

  static overrideLogger(logger: LoggerService) {
    this.staticInstance = logger;
  }

  log(message: unknown, context?: string) {
    this.instanceLogger.log(message, context);
  }

  error(message: unknown, trace?: string, context?: string) {
    this.instanceLogger.error(message, trace, context);
  }

  warn(message: unknown, context?: string) {
    this.instanceLogger.warn(message, context);
  }

  debug(message: unknown, context?: string) {
    this.instanceLogger.debug?.(message, context);
  }

  verbose(message: unknown, context?: string) {
    this.instanceLogger.verbose?.(message, context);
  }

  // Static methods
  static log(message: unknown, context?: string) {
    this.staticInstance.log(message, context);
  }

  static error(message: unknown, trace?: string, context?: string) {
    this.staticInstance.error(message, trace, context);
  }

  static warn(message: unknown, context?: string) {
    this.staticInstance.warn(message, context);
  }

  static debug(message: unknown, context?: string) {
    this.staticInstance.debug?.(message, context);
  }

  static verbose(message: unknown, context?: string) {
    this.staticInstance.verbose?.(message, context);
  }
}
