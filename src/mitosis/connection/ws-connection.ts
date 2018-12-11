import {AbstractConnection} from './connection';
import {IConnection} from './interface';

export class WSConnection extends AbstractConnection implements IConnection {

  public send(data: any): void {
  }

  public close(): Promise<void> {
    return undefined;
  }

  public open(): Promise<IConnection> {
    const socket = new WebSocket(`${this._address.getProtocol()}://${this._address.getPayload()}`);
    return undefined;
  }
}
