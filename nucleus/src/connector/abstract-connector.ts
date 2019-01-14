import {
  Address,
  ConnectionState,
  IConnection,
  IConnectionOptions,
  Message,
  Protocol,
  WebRTCConnection,
  WebRTCStreamConnection
} from 'mitosis';

export abstract class AbstractConnector<TConnection extends WebRTCConnection> {
  private _inAreaElement: HTMLTextAreaElement;
  private _outAreaElement: HTMLTextAreaElement;

  protected _connections: Array<TConnection>;

  protected abstract baseSelector: string;
  protected abstract address: Address;
  protected abstract Connection: new(...args: Array<any>) => TConnection;
  protected abstract connectionOptions: IConnectionOptions;

  constructor() {
    this._connections = [];
    setTimeout(this.init.bind(this));
  }

  private createOffer(): void {
    const connection = new this.Connection(this.address, this.connectionOptions);
    this._connections.unshift(connection);
    connection.observeMessageReceived().subscribe(
      (message: Message) => {
        this._outAreaElement.value = JSON.stringify(message.getBody());
      }
    );

    this.beforeCreateOffer(connection).then(() => {
      connection.open().then(this.onOpen.bind(this));
    });

    connection.observeStateChange().subscribe(
      (ev: ConnectionState) => this._outAreaElement.value = ev);
  }

  private createAnswer(): void {
    this.connectionOptions.payload = JSON.parse(this._inAreaElement.value);
    const connection = new this.Connection(this.address, this.connectionOptions);
    this._connections.unshift(connection);
    connection.observeMessageReceived().subscribe(
      (message: Message) => {
        this._outAreaElement.value = JSON.stringify(message.getBody());
      }
    );

    this.beforeCreateAnswer(connection).then(() => {
      connection.open().then(this.onOpen.bind(this));
    });

    connection.observeStateChange().subscribe(
      (ev: ConnectionState) => this._outAreaElement.value = ev);
  }

  private establish(): void {
    const answer = JSON.parse(this._inAreaElement.value);
    this._connections[0].establish(answer);
  }

  protected onOpen() {

  }

  protected bindButtonListeners(): void {
    document.querySelector(`${this.baseSelector} .create-offer-btn`).addEventListener('click', this.createOffer.bind(this));
    document.querySelector(`${this.baseSelector} .create-answer-btn`).addEventListener('click', this.createAnswer.bind(this));
    document.querySelector(`${this.baseSelector} .establish-btn`).addEventListener('click', this.establish.bind(this));
  }

  protected beforeCreateOffer(connection: TConnection): Promise<void> {
    return Promise.resolve();
  }

  protected beforeCreateAnswer(connection: TConnection): Promise<void> {
    return Promise.resolve();
  }

  protected init(): void {
    this._inAreaElement = document.querySelector(`${this.baseSelector} .in-text-area`);
    this._outAreaElement = document.querySelector(`${this.baseSelector} .out-text-area`);
    this.bindButtonListeners();
  }
}
