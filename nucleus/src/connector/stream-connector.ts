import {
  Address,
  ChurnType,
  ConnectionState,
  IConnection,
  IConnectionOptions,
  IStreamChurnEvent,
  Message,
  Protocol,
  WebRTCDataConnection,
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
        const stream = this._connections[1].getStream();
        if (stream) {
          connection.setStream(stream);
          resolve();
        } else {
          connection.observeStreamChurn().subscribe(
            (streamChurnEv: IStreamChurnEvent) => {
              if (streamChurnEv.type === ChurnType.ADDED) {
                connection.setStream(streamChurnEv.stream);
                resolve();
              }
            }
          );
        }
      }
    });
  }

  protected beforeCreateAnswer(connection: WebRTCStreamConnection): Promise<void> {
    return new Promise((resolve) => {
      if (connection.getStream()) {
        this._videoElement.srcObject = connection.getStream();
      } else {
        connection.observeStreamChurn().subscribe(
          (streamChurnEv: IStreamChurnEvent) => {
            if (streamChurnEv.type === ChurnType.ADDED) {
              this._videoElement.srcObject = connection.getStream();
            }
          }
        );
      }
      resolve();
    });
  }

  protected init(): void {
    console.log(this.baseSelector);
    this._videoElement = document.querySelector(`${this.baseSelector} video`);
    super.init();
  }
}
