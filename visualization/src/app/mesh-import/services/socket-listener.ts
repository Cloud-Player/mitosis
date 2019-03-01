import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {filter, first} from 'rxjs/operators';

enum SocketStatusTypes {
  OPEN = 'OPEN',
  MESSAGE = 'MESSAGE',
  CLOSED = 'CLOSED',
  ERROR = 'ERROR'
}

@Injectable()
export class SocketListenerService {
  private _client: WebSocket;
  private _retryOpenCounter = 0;
  private _isOpened: boolean;
  private _keepOpen: boolean;
  private _isClosing: boolean;
  private _socketStatus: Subject<SocketStatusTypes>;
  private _message: Subject<any>;

  constructor() {
    this._socketStatus = new Subject();
    this._message = new Subject();
  }

  private onSocketOpen() {
    this._isOpened = true;
    this._retryOpenCounter = 0;
    this._socketStatus.next(SocketStatusTypes.OPEN);
  }

  private onSocketClose() {
    if (this._keepOpen) {
      const timeout = this._retryOpenCounter === 0 ? 500 : 3000;
      setTimeout(this.reOpen.bind(this), timeout);
    }
    this._isOpened = false;
    this._isClosing = false;
    this._socketStatus.next(SocketStatusTypes.CLOSED);
  }

  private onSocketMessage(message) {
    let json = message.data;
    try {
      json = JSON.parse(message.data);
    } catch (e) {
      console.error(e);
    }
    this._message.next(json);
    this._socketStatus.next(SocketStatusTypes.MESSAGE);
  }

  private onSocketError() {
    this._socketStatus.next(SocketStatusTypes.ERROR);
  }

  private reOpen() {
    this._retryOpenCounter++;
    this.openSocketClient();
  }

  private observeSocketStatus() {
    return this._socketStatus;
  }

  private openSocketClient() {
    if (this._isClosing) {
      this.observeSocketStatus()
        .pipe(
          filter(ev => ev === SocketStatusTypes.CLOSED),
          first()
        )
        .subscribe(this.openSocketClient.bind(this));
      return;
    }
    if (this._isOpened) {
      this.closeSocketClient();
      this.openSocketClient();
      return;
    }
    this._client = new WebSocket(`wss://signal.aux.app/reporting/websocket`);
    this._client.onopen = this.onSocketOpen.bind(this);
    this._client.onclose = this.onSocketClose.bind(this);
    this._client.onmessage = this.onSocketMessage.bind(this);
    this._client.onerror = this.onSocketError.bind(this);
  }

  private closeSocketClient() {
    this._keepOpen = false;
    this._isOpened = false;
    this._isClosing = true;
    this._client.close();
  }

  public start() {
    this.openSocketClient();
  }

  public stop() {
    this.closeSocketClient();
  }

  public observe() {
    return this._message;
  }
}
