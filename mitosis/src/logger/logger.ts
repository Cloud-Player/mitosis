import {Subject} from 'rxjs';
import {ILogEvent, ILogger, LogLevel} from './interface';

export class Logger implements ILogger {

  private static _loggerMap: Map<string, ILogger> = new Map();
  private static _logLevel: LogLevel = LogLevel.DEBUG;

  private _id: string;
  private readonly _logSubject: Subject<ILogEvent>;

  public static getLogger(id: string): ILogger {
    if (!Logger._loggerMap.has(id)) {
      Logger._loggerMap.set(id, new Logger(id));
    }
    return Logger._loggerMap.get(id);
  }

  public static setLogLevel(logLevel: LogLevel) {
    this._logLevel = logLevel;
  }

  private constructor(id: string) {
    this._id = id;
    this._logSubject = new Subject<ILogEvent>();
  }

  public log(...args: Array<any>): void {
    console.log(`[${this._id}]`, ...args);
    this._logSubject.next({level: LogLevel.LOG, data: args});
  }

  public debug(...args: Array<any>): void {
    if (Logger._logLevel >= LogLevel.DEBUG) {
      console.log(`🔧 [${this._id}]`, ...args);
    }
    this._logSubject.next({level: LogLevel.DEBUG, data: args});
  }

  public info(...args: Array<any>): void {
    if (Logger._logLevel >= LogLevel.INFO) {
      console.info(`[${this._id}]`, ...args);
    }
    this._logSubject.next({level: LogLevel.INFO, data: args});
  }

  public warn(...args: Array<any>): void {
    if (Logger._logLevel >= LogLevel.WARN) {
      console.warn(`[${this._id}]`, ...args);
    }
    this._logSubject.next({level: LogLevel.WARN, data: args});
  }

  public error(...args: Array<any>): void {
    if (Logger._logLevel >= LogLevel.ERROR) {
      console.error(`[${this._id}]`, ...args);
    }
    this._logSubject.next({level: LogLevel.ERROR, data: args});
  }

  public observeLogEvents(): Subject<ILogEvent> {
    return this._logSubject;
  }
}
