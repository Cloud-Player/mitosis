import {Message} from '../message/message';
import {AbstractConnection} from './connection';
import {IConnection} from './interface';

export class WebSocketConnection extends AbstractConnection implements IConnection {

  private _socket: WebSocket;

  public send(message: Message): void {
    if (this._socket && this._socket.readyState === WebSocket.OPEN) {
      this._socket.send(message.toString());
    } else {
      // TODO: Queue message in out buffer or raise error
    }
  }

  private onSocketOpen(event: Event) {
    this.onOpen(this);
  }

  private onSocketClose(event: Event) {
    this.onClose();
  }

  private onSocketMessage(event: MessageEvent) {
    this.onMessage(Message.fromString(event.data));
  }

  private onSocketError(event: Event) {
    this.onError();
  }

  public openClient() {
    this._socket = new WebSocket(`${this._address.getProtocol()}://${this._address.getLocation()}`);
    this._socket.onopen = this.onSocketOpen.bind(this);
    this._socket.onclose = this.onSocketClose.bind(this);
    this._socket.onmessage = this.onSocketMessage.bind(this);
    this._socket.onerror = this.onSocketError.bind(this);
  }

  protected closeClient(): void {
  }
}
