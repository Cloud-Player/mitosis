export class LogEvent<TLog> {
  private readonly _tick: number;
  private readonly _event: TLog;

  constructor(tick: number, event: TLog) {
    this._tick = tick;
    this._event = event;
  }

  public getEvent(): TLog {
    return this._event;
  }

  public getTick(): number {
    return this._tick;
  }
}

export class NodeEventLogger<TLog> {
  public static maxSize = 100;

  private _logs: Array<LogEvent<TLog>>;

  constructor() {
    this._logs = [];
  }

  public add(event: LogEvent<TLog>): void {
    this._logs.unshift(event);
    this._logs.splice(NodeEventLogger.maxSize);
  }

  public addOrUpdateExisting(event: LogEvent<TLog>): void {
    const existing = this._logs
      .find(
        ev => ev.getTick() === event.getTick()
      );
    if (existing) {
      this._logs[this._logs.indexOf(existing)] = event;
    } else {
      this.add(event);
    }
  }

  public getLogs(): Array<LogEvent<TLog>> {
    return this._logs.slice();
  }

  public flush() {
    this._logs = [];
  }
}
