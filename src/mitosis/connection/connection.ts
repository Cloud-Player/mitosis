import {Subject} from 'rxjs';
import {Address} from '../message/address';
import {Message} from '../message/message';
import {IConnection, IConnectionOptions} from './interface';

export enum ConnectionState {
  OPEN = 'open',
  CLOSED = 'closed',
  ERROR = 'error'
}

export abstract class AbstractConnection {
  private _onOpenResolver: (connection: IConnection) => void;
  private _onOpenRejector: () => void;
  private _isOpen: boolean;
  protected _id: string;
  protected _options: IConnectionOptions;
  protected _address: Address;
  protected _stateChangeSubject: Subject<ConnectionState>;
  protected _messageReceivedSubject: Subject<Message>;

  public constructor(address: Address, options?: IConnectionOptions) {
    this._id = address.getLocation() || 'C' + Math.round(Math.random() * 100).toString();
    this._options = options;
    this._address = address;
    this._isOpen = false;
    this._stateChangeSubject = new Subject();
    this._messageReceivedSubject = new Subject();
  }

  protected abstract openClient(): void;

  protected abstract closeClient(): void;

  public getQuality(): number {
    return .0;
  }

  public getAddress(): Address {
    return this._address;
  }

  public getId(): string {
    return this._id;
  }

  public isOpen(): boolean {
    return this._isOpen;
  }

  public onOpen(connection: IConnection) {
    if (this._onOpenResolver) {
      this._onOpenResolver(connection);
      this._onOpenResolver = null;
      this._onOpenRejector = null;
    }
    this._isOpen = true;
    this._stateChangeSubject.next(ConnectionState.OPEN);
  }

  public onClose() {
    console.log('connection onClose');
    if (this._onOpenRejector) {
      this._onOpenRejector();
      this._onOpenResolver = null;
      this._onOpenRejector = null;
    }
    this._isOpen = false;
    this._stateChangeSubject.next(ConnectionState.CLOSED);
    this._stateChangeSubject.complete();
    this._messageReceivedSubject.complete();
  }

  public onError() {
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
    return new Promise<IConnection>((resolve, reject) => {
      this._onOpenResolver = resolve;
      this._onOpenRejector = reject;
      this.openClient();
    });
  }

  public observeMessageReceived(): Subject<Message> {
    return this._messageReceivedSubject;
  }

  public observeStateChange(): Subject<ConnectionState> {
    return this._stateChangeSubject;
  }
}
