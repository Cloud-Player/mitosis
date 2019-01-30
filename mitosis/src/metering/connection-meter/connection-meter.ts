import {Subject} from 'rxjs';
import {IClock} from '../../clock/interface';
import {IConnection} from '../../connection/interface';
import {IConnectionEventType, IConnectionMeterEvent} from './interface';
import {Configuration} from '../../configuration';

export abstract class ConnectionMeter {

  private _punished = false;
  private _protected = false;
  private _connection: IConnection;
  private _subject: Subject<IConnectionMeterEvent>;

  protected abstract _clock: IClock;

  constructor(connection: IConnection) {
    this._connection = connection;
    this._subject = new Subject();
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
