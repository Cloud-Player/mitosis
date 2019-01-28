import {Subject} from 'rxjs';
import {IClock} from '../clock/interface';

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
  tick: number;
}

export interface ILogger {

  setLevel(level: LogLevel): void;

  setClock(clock: IClock): void;

  log(...args: Array<any>): void;

  debug(...args: Array<any>): void;

  info(...args: Array<any>): void;

  warn(...args: Array<any>): void;

  error(...args: Array<any>): void;

  observeLogEvents(): Subject<ILogEvent>;
}
