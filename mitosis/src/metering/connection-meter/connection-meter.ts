import {Subject} from 'rxjs';
import {IClock} from '../../clock/interface';
import {ConfigurationMap} from '../../configuration';
import {IConnection} from '../../connection/interface';
import {Logger} from '../../logger/logger';
import {Message} from '../../message/message';
import {IConnectionEventType, IConnectionMeterEvent} from './interface';

export abstract class ConnectionMeter {
  private _punished = false;
  private _protected = false;
  private _subject: Subject<IConnectionMeterEvent>;
  private _lastSeenTick = 0;
  protected _connection: IConnection;
  protected _clock: IClock;

  constructor(connection: IConnection, clock: IClock) {
    this._connection = connection;
    this._subject = new Subject();
    this._clock = clock.fork();
    this.listenOnMessages();
  }

  private listenOnMessages(): void {
    this._connection.observeMessageReceived()
      .subscribe(
        this.onMessage.bind(this)
      );
  }

  private setPunished(isPunished: boolean): void {
    const wasPunished = this._punished;
    this._punished = isPunished;

    if (this._punished !== wasPunished) {
      if (this._punished) {
        this._subject.next({type: IConnectionEventType.PUNISHED, connection: this._connection});
      } else {
        this._subject.next({type: IConnectionEventType.UNPUNISHED, connection: this._connection});
      }
    }
  }

  private setProtected(isProtected: boolean): void {
    const wasProtected = this._protected;
    this._protected = isProtected;

    if (this._protected !== wasProtected) {
      if (this._protected) {
        this._subject.next({type: IConnectionEventType.PROTECTED, connection: this._connection});
      } else {
        this._subject.next({type: IConnectionEventType.UNPROTECTED, connection: this._connection});
      }
    }
  }

  protected onMessage(message: Message): void {
    if (!this._clock) {
      Logger.getLogger(this._connection.getAddress().getId()).error(`can not read clock for message`, message);
    } else {
      this._lastSeenTick = this._clock.getTick();
    }
  }

  protected updateLastSeen(): void {
    this._lastSeenTick = this._clock.getTick();
  }

  public abstract getQuality(): number;

  public isLastSeenExpired(): boolean {
    return (this._clock.getTick() - this._lastSeenTick) > ConfigurationMap.getDefault().LAST_SEEN_TIMEOUT;
  }

  public getLastSeen(): number {
    return this._lastSeenTick;
  }

  public isPunished(): boolean {
    return this._punished;
  }

  public isProtected(): boolean {
    return this._protected;
  }

  public start(): void {
    this.setProtected(true);
    this._clock.rewind();
    // TODO: Use role specific configuration for this remote peer
    this._clock.setTimeout(() => {
      this.setPunished(false);
      this.setProtected(false);
    }, ConfigurationMap.getDefault().CONNECTION_METER_PROTECTION_TIME);
  }

  public stop(): void {
    // TODO: Use role specific configuration for this remote peer
    const prematureClose = this._clock.getTick() < ConfigurationMap.getDefault().CONNECTION_METER_OPEN_GRACE_PERIOD_TIME;
    this.setPunished(prematureClose);
    this.setProtected(false);
  }

  public observe(): Subject<IConnectionMeterEvent> {
    return this._subject;
  }

  public toJSON(): {[key: string]: any} {
    return {
      lastSeen: this.getLastSeen(),
      protected: this.isProtected(),
      punished: this.isPunished(),
      isExpired: this.isLastSeenExpired(),
      quality: this.getQuality()
    };
  }

  public toString(): string {
    return JSON.stringify(
      this.toJSON(),
      undefined,
      2
    );
  }
}
