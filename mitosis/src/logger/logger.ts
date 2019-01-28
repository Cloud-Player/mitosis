import {Subject} from 'rxjs';
import {IClock} from '../clock/interface';
import {ILogEvent, ILogger, LogLevel} from './interface';

export class Logger implements ILogger {

  private static _loggerMap: Map<string, ILogger> = new Map();
  private static _logLevel: LogLevel = LogLevel.DEBUG;
  private _logLevel: LogLevel = null;
  private _clock: IClock;

  private _id: string;
  private readonly _logSubject: Subject<ILogEvent>;

  public static getLogger(id: string): ILogger {
    if (!Logger._loggerMap.has(id)) {
      Logger._loggerMap.set(id, new Logger(id));
    }
    return Logger._loggerMap.get(id);
  }

  public static setLevel(level: LogLevel) {
    Logger._logLevel = level;
  }

  private constructor(id: string) {
    this._id = id;
    this._logSubject = new Subject<ILogEvent>();
  }

  private getCurrentTick() {
    if (this._clock) {
      return this._clock.getTick();
    } else {
      return 0;
    }
  }

  public setClock(clock: IClock) {
    this._clock = clock;
  }

  public getLevel(): LogLevel {
    return this._logLevel || Logger._logLevel;
  }

  public setLevel(level: LogLevel): void {
    this._logLevel = level;
  }

  public log(...args: Array<any>): void {
    console.log(`[${this._id}]`, ...args);
    this._logSubject.next({level: LogLevel.LOG, data: args, tick: this.getCurrentTick()});
  }

  public debug(...args: Array<any>): void {
    if (this.getLevel() <= LogLevel.DEBUG) {
      console.log(`🔧 [${this._id}]`, ...args);
    }
    this._logSubject.next({level: LogLevel.DEBUG, data: args, tick: this.getCurrentTick()});
  }

  public info(...args: Array<any>): void {
    if (this.getLevel() <= LogLevel.INFO) {
      console.info(`[${this._id}]`, ...args);
    }
    this._logSubject.next({level: LogLevel.INFO, data: args, tick: this.getCurrentTick()});
  }

  public warn(...args: Array<any>): void {
    if (this.getLevel() <= LogLevel.WARN) {
      console.warn(`[${this._id}]`, ...args);
    }
    this._logSubject.next({level: LogLevel.WARN, data: args, tick: this.getCurrentTick()});
  }

  public error(...args: Array<any>): void {
    if (this.getLevel() <= LogLevel.ERROR) {
      console.error(`[${this._id}]`, ...args);
    }
    this._logSubject.next({level: LogLevel.ERROR, data: args, tick: this.getCurrentTick()});
  }

  public observeLogEvents(): Subject<ILogEvent> {
    return this._logSubject;
  }
}
