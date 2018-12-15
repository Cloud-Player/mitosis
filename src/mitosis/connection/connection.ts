import {Subject} from 'rxjs';
import {Address} from '../message/address';
import {Message} from '../message/message';
import {ConnectionState, IConnection, IConnectionOptions} from './interface';

export abstract class AbstractConnection {
  private _onOpenResolver: (connection: IConnection) => void;
  private _onOpenRejector: () => void;
  private _state: ConnectionState;
  protected _id: string;
  protected _options: IConnectionOptions;
  protected _address: Address;
  protected _stateChangeSubject: Subject<ConnectionState>;
  protected _messageReceivedSubject: Subject<Message>;

  public constructor(address: Address, options?: IConnectionOptions) {
    if (!address.getLocation()) {
      address.setLocation(`c${Math.round(10000 + Math.random() * 89999)}`);
    }
    this._id = address.getLocation();
    this._options = options;
    this._address = address;
    this._state = ConnectionState.CLOSED;
    this._stateChangeSubject = new Subject();
    this._messageReceivedSubject = new Subject();
  }

  protected abstract openClient(): void;

  protected abstract closeClient(): void;

  public getQuality(): number {
    return 1.0;
  }

  public getAddress(): Address {
    return this._address;
  }

  public getId(): string {
    return this._id;
  }

  public onOpen(connection: IConnection) {
    if (this._onOpenResolver) {
      this._onOpenResolver(connection);
      this._onOpenResolver = null;
      this._onOpenRejector = null;
    }
    this._state = ConnectionState.OPEN;
    this._stateChangeSubject.next(ConnectionState.OPEN);
  }

  public onClose() {
    console.log('connection onClose');
    if (this._onOpenRejector) {
      this._onOpenRejector();
      this._onOpenResolver = null;
      this._onOpenRejector = null;
    }
    this._state = ConnectionState.CLOSED;
    this._stateChangeSubject.next(ConnectionState.CLOSED);
    this._stateChangeSubject.complete();
    this._messageReceivedSubject.complete();
  }

  public onError() {
    this._state = ConnectionState.ERROR;
    this._stateChangeSubject.next(ConnectionState.ERROR);
    this.onClose();
  }

  public onMessage(message: Message) {
    this._messageReceivedSubject.next(message);
  }

  public close() {
    console.log('connection close');
    this.closeClient();
  }

  public open(): Promise<IConnection> {
    this._state = ConnectionState.CONNECTING;
    return new Promise<IConnection>((resolve, reject) => {
      this._onOpenResolver = resolve;
      this._onOpenRejector = reject;
      this.openClient();
    });
  }

  public getState(): ConnectionState {
    return this._state;
  }

  public observeMessageReceived(): Subject<Message> {
    return this._messageReceivedSubject;
  }

  public observeStateChange(): Subject<ConnectionState> {
    return this._stateChangeSubject;
  }
}
