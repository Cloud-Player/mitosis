import {SlidingWindow} from '../metering/sliding-window';
import {IFloodableMessage, IMessage} from './interface';
import {PeerManager} from '../peer/peer-manager';
import {Logger} from '../logger/logger';

export class FloodingHandler {
  private _slidingWindow: SlidingWindow;
  private _peerManager: PeerManager;

  constructor(peerManger: PeerManager) {
    this._peerManager = peerManger;
    this._slidingWindow = new SlidingWindow();
  }

  private isDirectPeerMessage(message: IFloodableMessage): boolean {
    return message.getSender().getId() === message.getInboundAddress().getId();
  }

  private slidingWindowSayYes(message: IFloodableMessage): boolean {
    return this._slidingWindow.isSequenceOutOfWindow(message.getBody().sequence);
  }

  private canForwardMessage(message: IFloodableMessage): boolean {
    if (this.isDirectPeerMessage(message)) {
      return true;
    } else {
      return this.slidingWindowSayYes(message);
    }
  }

  public isFirstMessage(message: IMessage): boolean {
    return this.slidingWindowSayYes(message);
  }

  public floodMessage(message: IFloodableMessage): void {
    if (this.canForwardMessage(message)) {
      Logger.getLogger(this._peerManager.getMyId())
        .debug('broadcast message',
          message.getInboundAddress(), message,
          this._slidingWindow.getSequenceNumber(),
          this._slidingWindow.isSequenceOutOfWindow(message.getBody().sequence)
        );
      this._peerManager.sendMessage(message);
      this._slidingWindow.add(message.getBody().sequence);
    } else {
      Logger.getLogger(this._peerManager.getMyId())
        .info('drop broadcast message',
          message.getInboundAddress(),
          message,
          this._slidingWindow.getSequenceNumber(),
          this._slidingWindow.isSequenceOutOfWindow(message.getBody().sequence)
        );
    }
  }
}
