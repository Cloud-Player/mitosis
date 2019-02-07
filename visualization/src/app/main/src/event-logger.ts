import {IClock} from 'mitosis';

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

  public getLogs(): Array<LogEvent<TLog>> {
    return this._logs.slice();
  }

  public flush() {
    this._logs = [];
  }
}

export class EventLogger<TLog> {
  private _eventsPerNodeId: Map<string, NodeEventLogger<TLog>>;
  private _clock: IClock;

  constructor() {
    this._eventsPerNodeId = new Map();
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

  public addEventForNodeId(nodeId: string, event: any) {
    let existingNodeEventLogger: NodeEventLogger<TLog> = this._eventsPerNodeId.get(nodeId);
    if (!existingNodeEventLogger) {
      existingNodeEventLogger = this._eventsPerNodeId
        .set(nodeId, new NodeEventLogger())
        .get(nodeId);
    }
    existingNodeEventLogger.add(new LogEvent(this.getCurrentTick(), event));
  }

  public getEventsForNodeId(nodeId: string): Array<LogEvent<TLog>> {
    const existingNodeEventLogger: NodeEventLogger<TLog> = this._eventsPerNodeId.get(nodeId);
    if (existingNodeEventLogger) {
      return existingNodeEventLogger.getLogs();
    } else {
      return [];
    }
  }

  public purgeEventsForNodeId(nodeId: string): void {
    const existingNodeEventLogger: NodeEventLogger<TLog> = this._eventsPerNodeId.get(nodeId);
    if (existingNodeEventLogger) {
      return existingNodeEventLogger.flush();
    }
  }
}
