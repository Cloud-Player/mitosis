import {AbstractConnection, ConnectionState, IConnection, Message} from 'mitosis';
import {Simulation} from '../simulation';

export abstract class MockConnection extends AbstractConnection implements IConnection {

  protected _delay = 1;
  protected readonly _client: Simulation = Simulation.getInstance();
  protected _quality = 1;
  protected _connectionDelay = 1;

  protected abstract openClient(): void;

  protected closeClient(): void {
    this.onClose();
  }

  public onClose(): void {
    super.onClose();
    this._client.removeConnection(this._options.mitosisId, this._address.getId());
    const remoteEdgeKey = [this._address.getId(), this._options.mitosisId].join('-');
    const remoteEdge = this._client.getEdgeMap().get(remoteEdgeKey);
    remoteEdge.getConnection().closeClient();
  }

  public send(message: Message): void {
    if (this.getState() !== ConnectionState.OPEN) {
      throw new Error('mock connection not in open state');
    } else {
      this._client.deliverMessage(
        this._options.mitosisId,
        this._address.getId(),
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

  public getQuality(): number {
    return this._quality;
  }

  public getConnectionDelay() {
    return this._connectionDelay;
  }

  public getSourceId(): string {
    return this._options.mitosisId;
  }
}
