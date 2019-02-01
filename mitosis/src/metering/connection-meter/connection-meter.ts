import {Subject} from 'rxjs';
import {IClock} from '../../clock/interface';
import {Configuration} from '../../configuration';
import {IConnection} from '../../connection/interface';
import {Logger} from '../../logger/logger';
import {MessageSubject} from '../../message/interface';
import {Message} from '../../message/message';
import {IConnectionEventType, IConnectionMeterEvent} from './interface';

export abstract class ConnectionMeter {
  private _punished = false;
  private _protected = false;
  private _connection: IConnection;
  private _subject: Subject<IConnectionMeterEvent>;
  private _lastSeenTick = 0;

  protected _clock: IClock;

  constructor(connection: IConnection, clock: IClock) {
    this._connection = connection;
    this._subject = new Subject();
    this._clock = clock;
    this.listenOnMessages();
  }

  private listenOnMessages() {
    this._connection.observeMessageReceived()
      .subscribe(
        this.onMessage.bind(this)
      );
  }

  protected onMessage(message: Message) {
    if (!this._clock) {
      Logger.getLogger(this._connection.getAddress().getId()).error(`can not read clock for message`, message);
    } else {
      this._lastSeenTick = this._clock.getTick();
    }
  }

  private setProtected(isProtected: boolean) {
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

  private setPunished(isPunished: boolean) {
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

  public getLastSeen(): number {
    return this._lastSeenTick;
  }

  public isPunished() {
    return this._punished;
  }

  public isProtected() {
    return this._protected;
  }

  public start(): void {
    this.setProtected(true);
    this._clock.reset();
    this._clock.setTimeout(() => {
      this.setPunished(false);
      this.setProtected(false);
    }, Configuration.CONNECTION_METER_PROTECTION_TIME);
  }

  public stop(): void {
    const prematureClose = this._clock.getTick() < Configuration.CONNECTION_METER_OPEN_GRACE_PERIOD_TIME;
    this.setPunished(prematureClose);
    this.setProtected(false);
  }

  public observe() {
    return this._subject;
  }
}
