import {Subject} from 'rxjs';
import {IClock} from '../clock/interface';
import {Address} from '../message/address';
import {IMessage} from '../message/interface';
import {IConnectionMeter} from '../metering/connection-meter/interface';
import {ConnectionState, IConnection, IConnectionOptions, NegotiationState} from './interface';

export abstract class AbstractConnection {

  private _onOpenResolver: (connection: IConnection) => void;
  private _onOpenRejector: (error?: any) => void;
  protected _connectionState: ConnectionState;
  protected _negotiationState: NegotiationState;
  protected _id: string;
  protected _meter: IConnectionMeter;
  protected _clock: IClock;
  protected _options: IConnectionOptions;
  protected _address: Address;
  protected _stateChangeSubject: Subject<ConnectionState>;
  protected _messageReceivedSubject: Subject<IMessage>;

  public constructor(address: Address, clock: IClock, options: IConnectionOptions) {
    if (!address.getLocation()) {
      address.setLocation(`c${Math.round(10000 + Math.random() * 89999)}`);
    }
    this._id = address.getLocation();
    this._options = options;
    this._address = address;
    this._clock = clock;
    this._connectionState = ConnectionState.CLOSED;
    this._stateChangeSubject = new Subject();
    this._messageReceivedSubject = new Subject();
  }

  protected abstract openClient(): void;

  protected abstract closeClient(): void;

  public getMeter(): IConnectionMeter {
    return this._meter;
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
    }
    this._onOpenResolver = null;
    this._onOpenRejector = null;
    this._connectionState = ConnectionState.OPEN;
    this._negotiationState = NegotiationState.ESTABLISHED;
    this._stateChangeSubject.next(this._connectionState);
    this.getMeter().start();
  }

  public onClose(reason: any = 'connection closed without reason') {
    this.getMeter().stop();
    if (this._onOpenRejector) {
      this._onOpenRejector(reason);
    }
    this._clock.stop();
    this._onOpenResolver = null;
    this._onOpenRejector = null;
    this._negotiationState = null;
    this._connectionState = ConnectionState.CLOSED;
    this._stateChangeSubject.next(this._connectionState);
    this._stateChangeSubject.complete();
    this._messageReceivedSubject.complete();
  }

  public onError(reason: any = 'connection error without reason') {
    this._connectionState = ConnectionState.ERROR;
    this._stateChangeSubject.next(this._connectionState);
    this.onClose(reason);
  }

  public onMessage(message: IMessage) {
    this._messageReceivedSubject.next(message);
  }

  public close() {
    this._connectionState = ConnectionState.CLOSING;
    this._stateChangeSubject.next(this._connectionState);
    this.closeClient();
  }

  public open(): Promise<IConnection> {
    this._connectionState = ConnectionState.OPENING;
    this._negotiationState = NegotiationState.INITIALIZING;
    this._stateChangeSubject.next(this._connectionState);
    return new Promise<IConnection>((resolve, reject) => {
      this._onOpenResolver = resolve;
      this._onOpenRejector = reject;
      this.openClient();
    });
  }

  public isInState(...states: Array<ConnectionState>): boolean {
    return states.indexOf(this.getState()) !== -1;
  }

  public getState(): ConnectionState {
    return this._connectionState;
  }

  public getNegotiationState(): NegotiationState {
    return this._negotiationState;
  }

  public observeMessageReceived(): Subject<IMessage> {
    return this._messageReceivedSubject;
  }

  public observeStateChange(): Subject<ConnectionState> {
    return this._stateChangeSubject;
  }

  public toString(): string {
    return JSON.stringify({
        id: this._id,
        address: this._address.toString(),
        connectionState: this._connectionState,
        negotiationState: this._negotiationState,
        meter: this.getMeter().toJSON()
      },
      undefined,
      2
    );
  }
}
