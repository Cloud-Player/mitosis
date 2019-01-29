import {AbstractConnection, Address, ConnectionState, IClock, IConnection, IConnectionOptions, Logger, Message} from 'mitosis';
import {filter} from 'rxjs/operators';
import {MockMeter} from '../metering/mock-meter';
import {Simulation} from '../simulation';

export abstract class MockConnection extends AbstractConnection implements IConnection {

  protected _delay = 1;
  protected readonly _client: Simulation = Simulation.getInstance();
  protected _connectionDelay = 1;
  private _timeout: number;

  protected abstract openClient(): void;

  public constructor(address: Address, clock: IClock, options?: IConnectionOptions) {
    super(address, clock, options);
    this.expectOpenWithinTimeout();
  }

  private expectOpenWithinTimeout(): void {
    this.observeStateChange().pipe(
      filter((ev: ConnectionState) => ev === ConnectionState.OPENING)
    ).subscribe(() => {
      this._timeout = this._client.getClock().setTimeout(
        () => {
          Logger.getLogger(this._options.mitosisId).warn('opening took too long', this.getAddress().toString());
          this.onError('took too long');
        },
        20
      );
    });
    this.observeStateChange().pipe(
      filter((ev: ConnectionState) => ev !== ConnectionState.OPENING)
    ).subscribe(
      () => {
        if (this._timeout) {
          this._client.getClock().clearTimeout(this._timeout);
        }
      });
  }

  protected closeClient(): void {
    this.onClose('mock connection close client');
  }

  public onClose(reason: any = 'mock connection on close'): void {
    super.onClose(reason);
    this._client.removeEdge(this._options.mitosisId, this._address.getId(), this._address.getLocation());
    const remoteEdge = this._client.getEdge(this._address.getId(), this._options.mitosisId, this._address.getLocation());
    if (remoteEdge) {
      remoteEdge.getConnection().closeClient();
    }
  }

  public send(message: Message): void {
    if (this.getState() !== ConnectionState.OPEN) {
      throw new Error('mock connection not in open state');
    } else {
      this._client.deliverMessage(
        this._options.mitosisId,
        this._address.getId(),
        this._address.getLocation(),
        this._delay,
        message);
    }
  }

  public setDelay(delay: number) {
    this._delay = delay;
  }

  public getDelay() {
    return this._delay;
  }

  public getConnectionDelay() {
    return this._connectionDelay;
  }

  public getSourceId(): string {
    return this._options.mitosisId;
  }
}
