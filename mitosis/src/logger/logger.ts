import {Subject} from 'rxjs';
import {IClock} from '../clock/interface';
import {ILogEvent, ILogger, LogLevel} from './interface';

export class Logger implements ILogger {

  private static _loggerMap: Map<string, ILogger> = new Map();
  private static _logLevel: LogLevel = LogLevel.DEBUG;
  private static _verbose = true;
  private _logLevel: LogLevel = null;
  private _clock: IClock;

  private _id: string;
  private readonly _logSubject: Subject<ILogEvent>;

  private constructor(id: string) {
    this._id = id;
    this._logSubject = new Subject<ILogEvent>();
  }

  public static getLogger(id: string): ILogger {
    if (!Logger._loggerMap.has(id)) {
      Logger._loggerMap.set(id, new Logger(id));
    }
    return Logger._loggerMap.get(id);
  }

  public static setLevel(level: LogLevel) {
    Logger._logLevel = level;
  }

  public static setVerbose(verbose: boolean): void {
    this._verbose = verbose;
  }

  private doLog(level: LogLevel, logFn: (...args: Array<any>) => void, prefix: string, args: Array<any>) {
    let currentTick = 0;
    let timestamp = '';
    if (this._clock) {
      currentTick = this._clock.getTick();
      timestamp = `${this._clock.getTick()}:`;
    }
    if (this.getLevel() <= level) {
      const tag = `${prefix} [${timestamp}${this._id}]`;
      if (!Logger._verbose) {
        args = args.slice(0, 1);
      }
      logFn(tag, ...args);
    }
    this._logSubject.next({level: level, data: args, tick: currentTick});
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
    this.doLog(LogLevel.LOG, console.log, '📠', args);
  }

  public debug(...args: Array<any>): void {
    this.doLog(LogLevel.DEBUG, console.log, '🔧', args);
  }

  public info(...args: Array<any>): void {
    this.doLog(LogLevel.INFO, console.info, '📬', args);
  }

  public warn(...args: Array<any>): void {
    this.doLog(LogLevel.WARN, console.warn, '🚧', args);
  }

  public error(...args: Array<any>): void {
    this.doLog(LogLevel.ERROR, console.error, '🚨', args);
  }

  public fatal(...args: Array<any>): void {
    this.doLog(LogLevel.FATAL, console.error, '💣', args);
  }

  public observeLogEvents(): Subject<ILogEvent> {
    return this._logSubject;
  }
}
