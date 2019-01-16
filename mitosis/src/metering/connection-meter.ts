import {Subject} from 'rxjs';
import {Address} from '../message/address';
import {MessageSubject} from '../message/interface';
import {Message} from '../message/message';
import {Ping} from '../message/ping';
import {Pong} from '../message/pong';
import {SlidingWindow} from './sliding-window';

export class ConnectionMeter {
  public static readonly PING_INTERVAL = 1000;
  private _pingSequence = 1;
  private _receiveSlidingWindow: SlidingWindow;
  private _echoSlidingWindow: SlidingWindow;
  private _pingInterval: any;
  private _originator: Address;
  private _receiver: Address;
  private _messageSubject: Subject<Message>;

  constructor(originator: Address, receiver: Address) {
    this._receiveSlidingWindow = new SlidingWindow();
    this._echoSlidingWindow = new SlidingWindow();
    this._originator = originator;
    this._receiver = receiver;
    this._messageSubject = new Subject<Message>();
  }

  private emitMessage(message: Message) {
    this._messageSubject.next(message);
  }

  private sendPong(receiver: Address, sequence: number) {
    const pong = new Pong(
      this._originator,
      receiver,
      sequence
    );
    this.emitMessage(pong);
  }

  private sendPing() {
    console.log(`Send ping to ${this._receiver.getId()} ${this._pingSequence}`);
    this._echoSlidingWindow.slideSequence(this._pingSequence);
    console.log('[DISPATCH PING] ECHO SLIDING WINDOW', Array.from(this._echoSlidingWindow.values()).join(','));
    const ping = new Ping(
      this._originator,
      this._receiver,
      this._pingSequence
    );
    this.emitMessage(ping);
    this._pingSequence++;
  }

  private handlePing(message: Ping) {
    console.log(`Got ping from ${message.getSender().getId()} ${message.getBody()}`);
    console.log('[HANDLE PING] RECEIVE SLIDING WINDOW', Array.from(this._receiveSlidingWindow.values()).join(','));
    this.sendPong(message.getSender(), message.getBody());
    this._receiveSlidingWindow.slideAndAddSequence(message.getBody());
  }

  private handlePong(message: Pong) {
    console.log(`Got pong from ${message.getSender().getId()} ${message.getBody()}`);
    this._echoSlidingWindow.slideAndAddSequence(message.getBody());
    console.log('[HANDLE PONG] ECHO SLIDING WINDOW', Array.from(this._echoSlidingWindow.values()).join(','));
  }

  private getEq(): number {
    return (this._echoSlidingWindow.size) / SlidingWindow.WINDOW_SIZE;
  }

  private getRq(): number {
    return (this._receiveSlidingWindow.size) / SlidingWindow.WINDOW_SIZE;
  }

  public getTq(): number {
    const tq = this.getEq() / this.getRq();
    if (tq > 1) {
      console.warn(`EQ ${this.getEq()} > RQ ${this.getRq()}. EQ SHOULD NOT EXCEED RQ!`);
      // XXX Eq should not exceed Rq
      return 1;
    } else {
      return tq;
    }
  }

  public onMessage(message: Message): void {
    if (message.getSubject() === MessageSubject.PING) {
      this.handlePing(message as Ping);
    } else if (message.getSubject() === MessageSubject.PONG) {
      this.handlePong(message as Pong);
    }
  }

  public observeMessages() {
    return this._messageSubject;
  }

  public startMetering(): void {
    this._pingInterval = setInterval(() => {
      this.sendPing();
      console.log('[TQ]', this.getTq());
    }, ConnectionMeter.PING_INTERVAL);
  }

  public stopMetering(): void {
    if (this._pingInterval) {
      clearInterval(this._pingInterval);
    }
  }
}
