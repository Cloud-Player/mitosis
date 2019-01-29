import {IMeter} from './interface';

export class StreamConnectionMeter implements IMeter {

  public getQuality(): number {
    // TODO: Get quality from WebRTCPeerConnection
    return 1;
  }

  public start(): void {
  }

  public stop(): void {
  }
}
