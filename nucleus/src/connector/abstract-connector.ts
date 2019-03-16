import {Address, ConnectionState, IConnection, IConnectionOptions, MasterClock, Message, WebRTCConnection} from 'mitosis';
import {filter, first} from 'rxjs/operators';

export abstract class AbstractConnector<TConnection extends WebRTCConnection> {
  private _inAreaElement: HTMLTextAreaElement;
  private _outAreaElement: HTMLTextAreaElement;
  private _createOfferBtn: HTMLButtonElement;
  private _createAnswerBtn: HTMLButtonElement;
  private _establishBtn: HTMLButtonElement;

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
    if (this.connectionOptions && this.connectionOptions.payload) {
      delete this.connectionOptions.payload;
    }
    const connection = new this.Connection(this.address, new MasterClock(), this.connectionOptions);
    this._connections.unshift(connection);
    connection.observeMessageReceived()
      .pipe(
        first()
      )
      .subscribe(
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
    const connection = new this.Connection(this.address, new MasterClock(), this.connectionOptions);
    this._connections.unshift(connection);
    connection.observeMessageReceived()
      .pipe(
        first()
      )
      .subscribe(
        (message: Message) => {
          this._outAreaElement.value = JSON.stringify(message.getBody());
        }
      );

    this.beforeCreateAnswer(connection).then(() => {
      connection.open().then(this.onOpen.bind(this, connection));
    });

    connection.observeStateChange().subscribe(
      (ev: ConnectionState) => this._outAreaElement.value = ev);
  }

  private pastedAnswer(): void {
    this._createOfferBtn.disabled = true;
    this._createAnswerBtn.disabled = true;
    this._establishBtn.disabled = false;

  }

  private pastedOffer(): void {
    this._createOfferBtn.disabled = true;
    this._createAnswerBtn.disabled = false;
    this._establishBtn.disabled = true;
  }

  private pastedUnknownInput() {
    this._createOfferBtn.disabled = false;
    this._createAnswerBtn.disabled = true;
    this._establishBtn.disabled = true;
  }

  private establish(): void {
    const answer = JSON.parse(this._inAreaElement.value);
    this._connections[0].establish({payload: answer});
  }

  protected onOpen(connection: IConnection) {
    this._createOfferBtn.disabled = false;
    this._createAnswerBtn.disabled = true;
    this._establishBtn.disabled = true;
    this._inAreaElement.value = '';
    connection.observeStateChange()
      .pipe(
        filter(ev => ev === ConnectionState.CLOSED)
      )
      .subscribe(this.onClose.bind(this, connection));
  }

  protected onClose(connection: TConnection) {
    const indexOfConnection = this._connections.indexOf(connection);
    if (indexOfConnection !== -1) {
      console.warn('Remove connection that was closed!');
      this._connections.splice(indexOfConnection, 1);
    }
  }

  protected bindInputArea(): void {
    this._inAreaElement.addEventListener('input', () => {
      const val = this._inAreaElement.value;
      try {
        const parsed: any = JSON.parse(val);
        switch (parsed.type) {
          case 'offer':
            this.pastedOffer();
            break;
          case 'answer':
            this.pastedAnswer();
            break;
          default:
            this.pastedUnknownInput();
            break;
        }
      } catch (err) {
        this.pastedUnknownInput();
      }
    });

    this._outAreaElement.addEventListener('click', () => {
      this._outAreaElement.focus();
      this._outAreaElement.select();
    });
  }

  protected bindButtonListeners(): void {
    this._createOfferBtn.addEventListener('click', this.createOffer.bind(this));
    this._createAnswerBtn.addEventListener('click', this.createAnswer.bind(this));
    this._establishBtn.addEventListener('click', this.establish.bind(this));
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
    this._createOfferBtn = document.querySelector(`${this.baseSelector} .create-offer-btn`);
    this._createAnswerBtn = document.querySelector(`${this.baseSelector} .create-answer-btn`);
    this._establishBtn = document.querySelector(`${this.baseSelector} .establish-btn`);
    this.pastedUnknownInput();
    this._inAreaElement.value = '';
    this._outAreaElement.value = `
    1. Click on "Create offer" button\r
    2. Copy offer that appears in this textarea\r
    3. Open a new tab and paste the offer into the textarea above "Create offer button"\r
    4. Click on "Create answer" button\r
    5. Copy the answer that appears in this textarea\r
    6. Go to the previous tab and paste the answer into the textarea above "Create offer button"\r
    7. Click on "Establish" button
    `;
    this.bindButtonListeners();
    this.bindInputArea();
  }
}
