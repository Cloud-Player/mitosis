import {Address, ConnectionState, IConnectionOptions, Message, Protocol, WebRTCStreamConnection} from 'mitosis';

class Nucleus {

  private static _address: Address = Address.fromString('mitosis/v1/nucleus/webrtc-stream');

  private _connections: Array<WebRTCStreamConnection>;
  private _videoElement: HTMLVideoElement;
  private _inAreaElement: HTMLTextAreaElement;
  private _outAreaElement: HTMLTextAreaElement;

  constructor() {
    this._videoElement = document.querySelector('video');
    this._inAreaElement = document.querySelector('#inTextArea');
    this._outAreaElement = document.querySelector('#outTextArea');
    this._connections = [];
    this.bindButtonListeners();
  }

  private bindButtonListeners(): void {
    document.querySelector('#createOffer').addEventListener('click', this.createOffer.bind(this));
    document.querySelector('#createAnser').addEventListener('click', this.createAnswer.bind(this));
    document.querySelector('#establish').addEventListener('click', this.establish.bind(this));
  }

  private createOffer(): void {
    const options: IConnectionOptions = {
      protocol: Protocol.WEBRTC_STREAM
    };
    const connection = new WebRTCStreamConnection(Nucleus._address, options);
    this._connections.unshift(connection);
    connection.observeMessageReceived().subscribe(
      (message: Message) => {
        this._outAreaElement.value = JSON.stringify(message.getBody());
      }
    );

    if (this._connections.length === 1) {
      navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      }).then(
        (stream: MediaStream) => {
          this._videoElement.srcObject = stream;
          connection.setStream(stream);
          connection.open();
        });
    } else {
      this._connections[1].getStream().then(
        (stream: MediaStream) => {
          connection.setStream(stream);
          connection.open();
        }
      );
    }

    connection.observeStateChange().subscribe(
      (ev: ConnectionState) => this._outAreaElement.value = ev);
  }

  private createAnswer(): void {
    const options: IConnectionOptions = {
      protocol: Protocol.WEBRTC_STREAM,
      payload: JSON.parse(this._inAreaElement.value)
    };
    const connection = new WebRTCStreamConnection(Nucleus._address, options);
    this._connections.unshift(connection);
    connection.observeMessageReceived().subscribe(
      (message: Message) => {
        this._outAreaElement.value = JSON.stringify(message.getBody());
      }
    );
    connection.open();
    connection.observeStateChange().subscribe(
      (ev: ConnectionState) => this._outAreaElement.value = ev);
    connection.getStream().then(
      (stream: MediaStream) => {
        this._videoElement.srcObject = stream;
      }
    );
  }

  private establish(): void {
    const answer = JSON.parse(this._inAreaElement.value);
    this._connections[0].establish(answer);
  }
}

const nucleus = new Nucleus();
