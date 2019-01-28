import {Subject} from 'rxjs';
import {IClock} from '../clock/interface';
import {Address} from '../message/address';
import {MessageSubject} from '../message/interface';
import {Message} from '../message/message';
import {Ping} from '../message/ping';
import {Pong} from '../message/pong';
import {Logger} from '../mitosis';
import {SlidingWindow} from './sliding-window';

export class ConnectionMeter {
  public static readonly PING_INTERVAL = 4;
  private _clock: IClock;
  private _receiveSlidingWindow: SlidingWindow;
  private _echoSlidingWindow: SlidingWindow;
  private _pingInterval: any;
  private _originator: Address;
  private _receiver: Address;
  private _messageSubject: Subject<Message>;

  constructor(originator: Address, receiver: Address, clock: IClock) {
    this._receiveSlidingWindow = new SlidingWindow();
    this._echoSlidingWindow = new SlidingWindow();
    this._originator = originator;
    this._receiver = receiver;
    this._messageSubject = new Subject<Message>();
    this._clock = clock;
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
    this._echoSlidingWindow.slide();
    Logger.getLogger(this._originator.getId())
      .info(`Dispatch ping to ${this._receiver.getId()}`, this._echoSlidingWindow.getSequenceNumber());
    const ping = new Ping(
      this._originator,
      this._receiver,
      this._echoSlidingWindow.getSequenceNumber()
    );
    this.emitMessage(ping);
  }

  private handlePing(message: Ping) {
    Logger.getLogger(this._originator.getId())
      .info(`Handle ping from ${message.getSender().getId()}`, Array.from(this._receiveSlidingWindow.values()).join(','));
    this.sendPong(message.getSender(), message.getBody());
    this._receiveSlidingWindow.add(message.getBody());
  }

  private handlePong(message: Pong) {
    this._echoSlidingWindow.add(message.getBody());
    Logger.getLogger(this._originator.getId()).info(`TQ to ${this._receiver.getId()} ${this.getTq()}`);
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
      // Eq should not exceed Rq
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

  public start(): void {
    this._pingInterval = this._clock.setInterval(() => {
      this.sendPing();
    }, ConnectionMeter.PING_INTERVAL);
  }

  public stop(): void {
    if (this._pingInterval) {
      this._clock.clearInterval(this._pingInterval);
    }
  }
}
