import {Subject} from 'rxjs';
import {IClock} from '../../clock/interface';
import {ConfigurationMap} from '../../configuration';
import {ConnectionState, IConnection, Protocol} from '../../connection/interface';
import {Logger} from '../../logger/logger';
import {Address} from '../../message/address';
import {MessageSubject} from '../../message/interface';
import {Message} from '../../message/message';
import {Ping} from '../../message/ping';
import {Pong} from '../../message/pong';
import {RemotePeerTable} from '../../peer/remote-peer-table';
import {SlidingWindow} from '../sliding-window';
import {ConnectionMeter} from './connection-meter';
import {IConnectionMeter} from './interface';
import {LatencyStopwatch} from './latency-stopwatch';

export class TransmissionConnectionMeter extends ConnectionMeter implements IConnectionMeter {
  private _receiveSlidingWindow: SlidingWindow;
  private _echoSlidingWindow: SlidingWindow;
  private _pingInterval: any;
  private _originator: Address;
  private _receiver: Address;
  private _messageSubject: Subject<Message>;
  private _latencyPerSequence: LatencyStopwatch;

  constructor(connection: IConnection, originator: Address, receiver: Address, clock: IClock) {
    super(connection, clock);
    this._receiveSlidingWindow = new SlidingWindow();
    this._echoSlidingWindow = new SlidingWindow();
    this._originator = originator;
    this._receiver = receiver;
    this._messageSubject = new Subject<Message>();
    this._latencyPerSequence = new LatencyStopwatch(clock);
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
    const nextSequence = this._echoSlidingWindow.getSequenceNumber();
    const ping = new Ping(
      this._originator,
      this._receiver,
      nextSequence
    );
    this.emitMessage(ping);
    this._latencyPerSequence.start(nextSequence);
  }

  private handlePing(message: Ping) {
    Logger.getLogger(this._originator.getId())
      .debug(`handle ping from ${message.getSender().getId()}`, Array.from(this._receiveSlidingWindow.values()).join(','));
    this.sendPong(message.getSender(), message.getBody());
    this._receiveSlidingWindow.add(message.getBody());
  }

  private handlePong(message: Pong) {
    const sequence = message.getBody();
    this._echoSlidingWindow.add(sequence);
    this._latencyPerSequence.stop(sequence);
  }

  private getEq(): number {
    return (this._echoSlidingWindow.size) / ConfigurationMap.getDefault().SLIDING_WINDOW_SIZE;
  }

  private getRq(): number {
    return (this._receiveSlidingWindow.size) / ConfigurationMap.getDefault().SLIDING_WINDOW_SIZE;
  }

  public getLatencyQuality(remotePeers: RemotePeerTable): number {
    const myAverageLatency = this.getAverageLatency();
    if (myAverageLatency === 0) {
      return 0.5;
    }

    const allLatencies = remotePeers
      .aggregateConnections(
        table => table
          .filterByProtocol(Protocol.WEBRTC_DATA)
          .filterByStates(ConnectionState.OPEN)
      )
      .map(
        (connection: IConnection) => (connection.getMeter() as TransmissionConnectionMeter).getAverageLatency()
      )
      .filter(
        value => value > 0
      );

    if (allLatencies.length <= 1) {
      return 1.0;
    }

    const bestLatency: number = allLatencies
      .reduce(
        (previous, current) => current < previous ? current : previous, Number.MAX_SAFE_INTEGER
      );
    const worstLatency: number = allLatencies
      .reduce(
        (previous, current) => current > previous ? current : previous, 0
      );

    return 1 - (myAverageLatency - bestLatency) / (worstLatency - bestLatency);
  }

  public getAverageLatency() {
    const latencyValues = this._latencyPerSequence.asArray();
    if (latencyValues.length === 0) {
      return 0.5;
    }
    return Math.max(
      latencyValues
        .reduce(
          (previous, current) => previous + current, 0)
      / latencyValues.length
      , 0.5
    );
  }

  public getQuality(remotePeers: RemotePeerTable): number {
    const rq = this.getRq();
    if (rq === 0) {
      return 0;
    } else {
      const tq = this.getEq() / rq;
      if (tq > 1) {
        // Eq should not exceed Rq
        return this.getLatencyQuality(remotePeers);
      } else {
        return (tq + this.getLatencyQuality(remotePeers)) / 2;
      }
    }
  }

  public onMessage(message: Message): void {
    super.onMessage(message);
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
    }, ConfigurationMap.getDefault().TRANSMISSION_PING_INTERVAL);
  }

  public stop(): void {
    super.stop();
    if (this._pingInterval) {
      this._clock.clearInterval(this._pingInterval);
    }
  }
}
