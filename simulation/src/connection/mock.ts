import {AbstractConnection, IConnection, Message} from 'mitosis';
import {Simulation} from '../simulation';

export class MockConnection extends AbstractConnection implements IConnection {

  private static readonly _delay: 1;

  protected closeClient(): void {
    Simulation.getInstance()
      .removeConnection(this._options.mitosisId, this._address.getId());
    this.onClose();
  }

  protected openClient(): void {
    Simulation.getInstance()
      .addConnection(this._options.mitosisId, this._address.getId(), this);
    this.onOpen(this);
  }

  public send(message: Message): void {
    Simulation.getInstance()
      .deliverMessage(
        this._options.mitosisId,
        this._address.getId(),
        MockConnection._delay,
        message);
  }

  public getSourceId(): string {
    return this._options.mitosisId;
  }
}
