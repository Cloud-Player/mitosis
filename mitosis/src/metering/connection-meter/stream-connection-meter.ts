import {ConnectionMeter} from './connection-meter';
import {IConnectionMeter} from './interface';

export class StreamConnectionMeter extends ConnectionMeter implements IConnectionMeter {

  public getQuality(): number {
    // TODO: Get quality from WebRTCPeerConnection
    return 0.1;
  }

  public isLastSeenExpired(): boolean {
    return false;
  }

  public start(): void {
  }

  public stop(): void {
  }
}
