import {AbstractConnection, IConnection, Message} from 'mitosis';
import {Simulation} from '../index';

export class MockConnection extends AbstractConnection implements IConnection {

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
      .deliverMessage(this._options.mitosisId, this._address.getId(), message);
    console.log('send message', message);
  }
}
