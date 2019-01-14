import {Message} from '../message/message';
import {AbstractConnection} from './connection';
import {IConnection, IViaConnectionOptions} from './interface';

export class ViaConnection extends AbstractConnection implements IConnection {

  protected _options: IViaConnectionOptions;

  protected closeClient(): void {
    this.onClose();
  }

  protected openClient(): void {
    this.onOpen(this);
  }

  public getQuality(): number {
    return this._options.payload.quality;
  }

  public send(message: Message): void {
    throw new Error('via connection cannot send directly');
  }
}
