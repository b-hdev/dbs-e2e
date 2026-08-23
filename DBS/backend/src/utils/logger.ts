import pino from 'pino';
import pretty from 'pino-pretty';

// Configuração do stream com pino-pretty para logs formatados e coloridos no console
const prettyStream = pretty({
  colorize: true,
  translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
  ignore: 'pid,hostname',
  messageFormat: '{msg}',
});

// Logger raiz do Pino
export const rootLogger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
  },
  prettyStream
);

// Factory de configuração para o Fastify
export const createLoggerConfig = () => {
  return {
    level: process.env.LOG_LEVEL || 'info',
    stream: prettyStream,
  };
};

export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

/**
 * Wrapper de Logger compatível com Pino, com suporte a contexto / módulo.
 */
export class Logger {
  private pinoInstance: pino.Logger;

  constructor(_level: LogLevel = LogLevel.INFO, context?: string) {
    this.pinoInstance = context
      ? rootLogger.child({ context })
      : rootLogger;
  }

  debug(message: string, data?: any): void {
    if (data !== undefined) {
      this.pinoInstance.debug(data, message);
    } else {
      this.pinoInstance.debug(message);
    }
  }

  info(message: string, data?: any): void {
    if (data !== undefined) {
      this.pinoInstance.info(data, message);
    } else {
      this.pinoInstance.info(message);
    }
  }

  warn(message: string, data?: any): void {
    if (data !== undefined) {
      this.pinoInstance.warn(data, message);
    } else {
      this.pinoInstance.warn(message);
    }
  }

  error(message: string, error?: any): void {
    if (error !== undefined) {
      this.pinoInstance.error(
        {
          err: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        },
        message
      );
    } else {
      this.pinoInstance.error(message);
    }
  }
}