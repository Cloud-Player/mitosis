import {Subscription} from 'rxjs';
import {IClock} from '../clock/interface';
import {Address} from '../message/address';
import {Message} from '../message/message';
import {ViaConnectionMeter} from '../metering/connection-meter/via-connection-meter';
import {AbstractConnection} from './connection';
import {ConnectionState, IConnection, IViaConnectionOptions} from './interface';

export class ViaConnection extends AbstractConnection implements IConnection {

  private _parentSubscription: Subscription;
  protected _options: IViaConnectionOptions;

  constructor(address: Address, clock: IClock, options: IViaConnectionOptions) {
    super(address, clock, options);
    this._meter = new ViaConnectionMeter(this);
  }

  private parentStateChanged(connectionState: ConnectionState): void {
    switch (connectionState) {
      case ConnectionState.OPEN:
        this.onOpen(this);
        break;
      case ConnectionState.CLOSED:
        this.onClose('parent connection closed');
        break;
      case ConnectionState.ERROR:
        this.onError('parent connection error');
        break;
    }
  }

  protected closeClient(): void {
    this._parentSubscription.unsubscribe();
    this.onClose();
  }

  protected openClient(): void {
    const parent = this._options.payload.parent;
    if (!parent || parent.isInState(ConnectionState.CLOSING, ConnectionState.CLOSED)) {
      this.onError('parent connection missing');
    } else if (parent.isInState(ConnectionState.OPEN)) {
      this.onOpen(this);
    }
    this._parentSubscription = parent
      .observeStateChange()
      .subscribe(this.parentStateChanged.bind(this));
  }

  public send(message: Message): void {
    throw new Error('via connection cannot send directly');
  }
}
