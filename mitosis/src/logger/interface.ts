import {Subject} from 'rxjs';

export enum LogLevel {
  LOG = 0,
  DEBUG = 10,
  INFO = 20,
  WARN = 30,
  ERROR = 40
}

export interface ILogEvent {
  level: LogLevel;
  data: Array<any>;
}

export interface ILogger {

  log(...args: Array<any>): void;

  debug(...args: Array<any>): void;

  info(...args: Array<any>): void;

  warn(...args: Array<any>): void;

  error(...args: Array<any>): void;

  observeLogEvents(): Subject<ILogEvent>;
}
