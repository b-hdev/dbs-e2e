export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private level: LogLevel;
  private requestId: string;

  constructor(level: LogLevel = LogLevel.INFO, requestId?: string) {
    this.level = level;
    this.requestId = requestId || crypto.randomUUID();
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (level >= this.level) {
      const entry = {
        timestamp: new Date().toISOString(),
        level: LogLevel[level],
        requestId: this.requestId,
        message,
        ...(data && { data }),
      };
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, error?: any): void {
    this.log(LogLevel.ERROR, message, {
      error: error?.message || error,
      stack: error?.stack,
    });
  }
}