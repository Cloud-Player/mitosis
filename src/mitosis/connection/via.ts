import {Message} from '../message/message';
import {AbstractConnection} from './connection';
import {IConnection} from './interface';

export class ViaConnection extends AbstractConnection implements IConnection {

  protected closeClient(): void {
    this.onClose();
  }

  protected openClient(): void {
    this.onOpen(this);
  }

  public send(message: Message): void {
    throw new Error('Not implemented!');
  }
}
