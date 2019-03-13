import {AbstractConnection, Address, ConnectionState, IClock, IConnection, IConnectionOptions, Logger, Message} from 'mitosis';
import {filter} from 'rxjs/operators';
import {Simulation} from '../simulation';

export abstract class MockConnection extends AbstractConnection implements IConnection {
  private _timeout: number;
  protected readonly _client: Simulation = Simulation.getInstance();
  protected _connectionDelay = 1;

  public constructor(address: Address, clock: IClock, options?: IConnectionOptions) {
    super(address, clock, options);
    this.expectOpenWithinTimeout();
    const node = this._client.getNodeMap().get(this._options.mitosisId);
    if (node) {
      this._connectionDelay = node.getEstablishDelay();
    }
  }

  private expectOpenWithinTimeout(): void {
    this.observeStateChange().pipe(
      filter((ev: ConnectionState) => ev === ConnectionState.OPENING)
    ).subscribe(() => {
      this._timeout = this._client.getClock().setTimeout(
        () => {
          const reason = `connecting to ${this.getAddress().getId()} took too long`;
          Logger.getLogger(this._options.mitosisId).warn(reason, this);
          this.onError(reason);
        },
        20 * this._client.getSubTicks()
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

  protected abstract openClient(): void;

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
        message.clone());
    }
  }

  public getConnectionDelay() {
    return this._connectionDelay;
  }

  public getSourceId(): string {
    return this._options.mitosisId;
  }
}
