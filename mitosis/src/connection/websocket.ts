import {Message} from '../message/message';
import {AbstractConnection} from './connection';
import {ConnectionState, IConnection, Protocol} from './interface';

export class WebSocketConnection extends AbstractConnection implements IConnection {
  private _client: WebSocket;

  public send(message: Message): void {
    if (!this._client) {
      throw new Error('socket client not initialized');
    } else if (this.getState() !== ConnectionState.OPEN) {
      throw new Error(`socket connection not in open state (${this.getState()})`);
    } else if (this._client.readyState !== WebSocket.OPEN) {
      throw new Error(`socket client not in open state (${this._client.readyState})`);
    } else {
      this._client.send(message.toString());
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
    this.onError(event);
  }

  protected closeClient(): void {
    this._client.close();
    this._client = null;
  }

  public openClient() {
    this._client = new WebSocket(`${this._address.getProtocol()}://${this._address.getLocation()}`);
    this._client.onopen = this.onSocketOpen.bind(this);
    this._client.onclose = this.onSocketClose.bind(this);
    this._client.onmessage = this.onSocketMessage.bind(this);
    this._client.onerror = this.onSocketError.bind(this);
  }

  public getQuality(): number {
    return 0.5;
  }
}
