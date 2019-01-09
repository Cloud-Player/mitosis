import {AbstractConnection, ConnectionState, IConnection, Message} from 'mitosis';
import {Simulation} from '../simulation';

export class MockConnection extends AbstractConnection implements IConnection {

  protected _delay = 1;
  protected readonly _client: Simulation = Simulation.getInstance();

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

  public getSourceId(): string {
    return this._options.mitosisId;
  }
}
