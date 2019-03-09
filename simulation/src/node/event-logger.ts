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
  private _maxSize: number;

  private _logs: Array<LogEvent<TLog>>;

  constructor(maxSize = 100) {
    this._logs = [];
    this._maxSize = maxSize;
  }

  public setMaxSize(maxSize: number) {
    this._maxSize = maxSize;
    this._logs.splice(this._maxSize);
  }

  public add(event: LogEvent<TLog>): void {
    this._logs.unshift(event);
    this._logs.splice(this._maxSize);
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
