import {
  Address,
  ConnectionState,
  IConnection,
  IConnectionOptions,
  Message,
  Protocol, WebRTCDataConnection,
  WebRTCStreamConnection
} from 'mitosis';
import {AbstractConnector} from './abstract-connector';

export class StreamConnector extends AbstractConnector<WebRTCStreamConnection> {
  private _videoElement: HTMLVideoElement;
  protected baseSelector = '.stream-rtc';
  protected address = Address.fromString('mitosis/v1/nuclus/webrtc-stream');
  protected Connection = WebRTCStreamConnection;
  protected connectionOptions: IConnectionOptions = {mitosisId: 'nucleus'};

  protected beforeCreateOffer(connection: WebRTCStreamConnection): Promise<void> {
    return new Promise((resolve) => {
      if (this._connections.length === 1) {
        navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        }).then(
          (stream: MediaStream) => {
            this._videoElement.srcObject = stream;
            connection.setStream(stream);
            resolve();
          });
      } else {
        this._connections[1].getStream().then(
          (stream: MediaStream) => {
            connection.setStream(stream);
            resolve();
          }
        );
      }
    });
  }

  protected beforeCreateAnswer(connection: WebRTCStreamConnection): Promise<void> {
    return new Promise((resolve) => {
      connection.getStream().then(
        (stream: MediaStream) => {
          this._videoElement.srcObject = stream;
        }
      );
      resolve();
    });
  }

  protected init(): void {
    console.log(this.baseSelector);
    this._videoElement = document.querySelector(`${this.baseSelector} video`);
    super.init();
  }
}
