import {IConnection, Message} from 'mitosis';
import {MockConnection} from './mock';

export class ViaMockConnection extends MockConnection implements IConnection {

  protected closeClient(): void {
    this.onClose();
  }

  protected openClient(): void {
    this.onOpen(this);
  }

  public send(message: Message): void {
    throw new Error('via connection cannot send directly');
  }
}
