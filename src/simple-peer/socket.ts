import {Subject} from 'rxjs';
import {filter} from 'rxjs/operators';

export enum SocketStatusTypes {
  OPEN = 'OPEN',
  MESSAGE = 'MESSAGE',
  CLOSED = 'CLOSED',
  ERROR = 'ERROR',
  SEND_MESSAGE = 'SEND_MESSAGE'
}

export interface ISocketEvent {
  type: SocketStatusTypes;
  detail?: any;
}

export class SocketMessageService {
  private static instance: SocketMessageService;
  private _socket: WebSocket;
  private _isOpened: boolean;
  private _subject: Subject<ISocketEvent>;
  private _socketUrl: string;

  constructor() {
    this._subject = new Subject();
  }

  public static getInstance() {
    if (!SocketMessageService.instance) {
      SocketMessageService.instance = new SocketMessageService();
    }
    return SocketMessageService.instance;
  }

  public open(socketUrl: string) {
    if (this._isOpened) {
      this._socket.close();
    }
    this._socketUrl = socketUrl;
    this._socket = new WebSocket(socketUrl);
    this._socket.addEventListener('open', this.onOpen.bind(this));
    this._socket.addEventListener('message', this.onMessage.bind(this));
    this._socket.addEventListener('close', this.onClose.bind(this));
    this._socket.addEventListener('error', this.onError.bind(this));
  }

  public close() {
    this._isOpened = false;
    this._socket.close();
  }

  public sendMessage(message: any) {
    console.log('SEND MESSAGE', message);
    if (this._isOpened) {
      this._socket.send(JSON.stringify(message));
      this._subject.next({
        type: SocketStatusTypes.SEND_MESSAGE,
        detail: message
      });
    } else {
      this.observe()
        .pipe(
          filter((ev: ISocketEvent) => {
            return ev.type === SocketStatusTypes.OPEN;
          })
        )
        .subscribe(() => {
          this.sendMessage(message);
        });
    }
  }

  public isOpen() {
    return this._isOpened;
  }

  public observe() {
    return this._subject;
  }

  private onOpen(event: Event) {
    console.log('[SOCKET] Open');
    this._isOpened = true;
    this._subject.next({type: SocketStatusTypes.OPEN});
  }

  private onMessage(event: MessageEvent) {
    this._subject.next({type: SocketStatusTypes.MESSAGE, detail: JSON.parse(event.data)});
  }

  private onClose(event: Event) {
    console.warn('[SOCKET] Closed');
    if (this._isOpened) {
      this.reOpen();
    }
    this._isOpened = false;
    this._subject.next({type: SocketStatusTypes.CLOSED});
  }

  private onError(event: ErrorEvent) {
    console.error('[SOCKET] Error', event.error);
    this._subject.next({type: SocketStatusTypes.ERROR, detail: event.error});
  }

  private reOpen() {
    this.open(this._socketUrl);
  }
}
