import {Subject} from 'rxjs';
import {IClock} from '../../clock/interface';
import {Configuration} from '../../configuration';
import {IConnection} from '../../connection/interface';
import {Logger} from '../../logger/logger';
import {Address} from '../../message/address';
import {MessageSubject} from '../../message/interface';
import {Message} from '../../message/message';
import {Ping} from '../../message/ping';
import {Pong} from '../../message/pong';
import {SlidingWindow} from '../sliding-window';
import {ConnectionMeter} from './connection-meter';
import {IConnectionMeter} from './interface';

export class TransmissionConnectionMeter extends ConnectionMeter implements IConnectionMeter {
  protected _clock: IClock;
  private _receiveSlidingWindow: SlidingWindow;
  private _echoSlidingWindow: SlidingWindow;
  private _pingInterval: any;
  private _originator: Address;
  private _receiver: Address;
  private _messageSubject: Subject<Message>;

  constructor(connection: IConnection, originator: Address, receiver: Address, clock: IClock) {
    super(connection);
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
      .debug(`send ping to ${this._receiver.getId()}`, this._echoSlidingWindow.getSequenceNumber());
    const ping = new Ping(
      this._originator,
      this._receiver,
      this._echoSlidingWindow.getSequenceNumber()
    );
    this.emitMessage(ping);
  }

  private handlePing(message: Ping) {
    Logger.getLogger(this._originator.getId())
      .debug(`handle ping from ${message.getSender().getId()}`, Array.from(this._receiveSlidingWindow.values()).join(','));
    this.sendPong(message.getSender(), message.getBody());
    this._receiveSlidingWindow.add(message.getBody());
  }

  private handlePong(message: Pong) {
    this._echoSlidingWindow.add(message.getBody());
    Logger.getLogger(this._originator.getId())
      .debug(`quality to ${this._receiver.getId()} is ${this.getQuality()}`, message);
  }

  private getEq(): number {
    return (this._echoSlidingWindow.size) / Configuration.SLIDING_WINDOW_SIZE;
  }

  private getRq(): number {
    return (this._receiveSlidingWindow.size) / Configuration.SLIDING_WINDOW_SIZE;
  }

  public getQuality(): number {
    const rq = this.getRq();
    if (rq === 0) {
      return 0;
    } else {
      const tq = this.getEq() / rq;
      if (tq > 1) {
        // Eq should not exceed Rq
        return 1;
      } else {
        return tq;
      }
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
    super.start();
    this._pingInterval = this._clock.setInterval(() => {
      this.sendPing();
    }, Configuration.TRANSMISSION_PING_INTERVAL);
  }

  public stop(): void {
    super.stop();
    if (this._pingInterval) {
      this._clock.clearInterval(this._pingInterval);
    }
  }
}
