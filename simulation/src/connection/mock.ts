import {AbstractConnection, ConnectionState, IConnection, Message} from 'mitosis';
import {Simulation} from '../simulation';

export class MockConnection extends AbstractConnection implements IConnection {

  private static readonly _delay: 1;
  private readonly _client: Simulation = Simulation.getInstance();

  protected closeClient(): void {
    this._client.removeConnection(this._options.mitosisId, this._address.getId());
    this.onClose();
  }

  protected openClient(): void {
    this._client.addConnection(this._options.mitosisId, this._address.getId(), this);
    this.onOpen(this);
  }

  public send(message: Message): void {
    if (this.getState() !== ConnectionState.OPEN) {
      throw new Error('mock connection not in open state');
    } else {
      this._client.deliverMessage(
        this._options.mitosisId,
        this._address.getId(),
        MockConnection._delay,
        message);
    }
  }

  public getSourceId(): string {
    return this._options.mitosisId;
  }
}
