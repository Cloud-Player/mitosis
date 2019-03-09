import {IClock} from 'mitosis';
import {LogEvent, NodeEventLogger} from 'mitosis-simulation';

export class EventLogger<TLog> {
  private _eventsPerNodeId: Map<string, NodeEventLogger<TLog>>;
  private _clock: IClock;
  private _maxSize: number;

  constructor(maxSize = 100) {
    this._eventsPerNodeId = new Map();
    this._maxSize = maxSize;
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
      const logger: NodeEventLogger<TLog> = new NodeEventLogger();
      logger.setMaxSize(this._maxSize);
      existingNodeEventLogger = this._eventsPerNodeId
        .set(nodeId, logger)
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

  public setLogSize(size: number) {
    Array.from(this._eventsPerNodeId.entries())
      .forEach(
        ([key, value]) => {
          value.setMaxSize(size);
        }
      );
    this._maxSize = size;
  }
}
