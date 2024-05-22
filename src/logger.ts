const LOG_PREFIX = '[@jvdwaalsd/cf-custom-resource]'

export enum LogLevel {
  disabled,
  error,
  warn,
  info,
  debug,
}

export class Logger {
  /**
   * The log level
   *
   * @default LogLevel.warn
   */
  level: LogLevel;

  constructor(level?: LogLevel) {
    this.level = level ?? LogLevel.warn;
  }

  /**
   * Logs message with level ERROR
   */
  error(message: any, ...optionalParams: any[]) {
    if (this.level < LogLevel.error) return;
    console.error(LOG_PREFIX, message, ...optionalParams);
  }

  /**
   * Logs message with level WARN
   */
  warn(message: any, ...optionalParams: any[]) {
    if (this.level < LogLevel.warn) return;
    console.warn(LOG_PREFIX, message, ...optionalParams);
  }

  /**
   * Logs message with level INFO
   */
  info(message: any, ...optionalParams: any[]) {
    if (this.level < LogLevel.info) return;
    console.info(LOG_PREFIX, message, ...optionalParams);
  }

  /**
   * Logs message with level DEBUG
   */
  debug(message: any, ...optionalParams: any[]) {
    if (this.level < LogLevel.debug) return;
    console.debug(LOG_PREFIX, message, ...optionalParams);
  }

  /**
   * Alias for info
   */
  log(message: any, ...optionalParams: any[]) {
    this.info(LOG_PREFIX, message, ...optionalParams);
  }
}