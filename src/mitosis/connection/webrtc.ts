import {AbstractConnection} from './connection';
import {IConnection} from './interface';

export class WebRTCConnection extends AbstractConnection implements IConnection {

  public send(data: any): void {
  }

  public close(): Promise<void> {
    return undefined;
  }

  public open(): Promise<IConnection> {
    return undefined;
  }
}
