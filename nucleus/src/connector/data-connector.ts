import {
  Address,
  AppContent,
  ConnectionState,
  IConnection,
  IConnectionOptions,
  Message,
  Protocol,
  WebRTCDataConnection
} from 'mitosis';
import {AbstractConnector} from './abstract-connector';

export class DataConnector extends AbstractConnector<WebRTCDataConnection> {
  private _inMessagesElement: HTMLTextAreaElement;
  private _outMessageElement: HTMLTextAreaElement;
  private _sendElement: HTMLButtonElement;

  protected baseSelector = '.data-rtc';
  protected address = Address.fromString('mitosis/v1/nuclus/webrtc-data');
  protected Connection = WebRTCDataConnection;
  protected connectionOptions = {mitosisId: 'nucleus'};

  private sendMessage() {
    this._connections.forEach((connection) => {
      connection.send(
        new AppContent(
          this.address,
          connection.getAddress(),
          this._outMessageElement.value
        )
      );
    });
  }

  private onMessage(message: Message) {
    const msg = `
      ${+new Date()} ${message.getSender().getId()} ${message.getBody()}
    `;
    this._inMessagesElement.value = this._inMessagesElement.value += `\r${msg}`;
  }

  protected onOpen() {
    this._connections.forEach((connection: WebRTCDataConnection) => {
      connection.observeMessageReceived().subscribe(this.onMessage.bind(this));
    });
  }

  protected bindButtonListeners() {
    super.bindButtonListeners();
    this._sendElement.addEventListener('click', this.sendMessage.bind(this));
  }

  protected init(): void {
    console.log(this.baseSelector);
    this._inMessagesElement = document.querySelector(`${this.baseSelector} .in-messages`);
    this._outMessageElement = document.querySelector(`${this.baseSelector} .out-message`);
    this._sendElement = document.querySelector(`${this.baseSelector} .send-msg-btn`);
    super.init();
  }
}
