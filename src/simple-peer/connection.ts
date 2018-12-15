import {Subject} from 'rxjs';
import * as SimplePeer from 'simple-peer';
import {Message} from './message';
import {Utils} from './utils';

export enum ConnectionEventTypes {
  CONNECT = 'connect',
  MESSAGE = 'message',
  STREAM = 'stream',
  ERROR = 'error',
  SETUP = 'setup',
  CLOSE = 'setup'
}

export interface IConnectionEvent {
  type: ConnectionEventTypes;
  body?: any;
}

export interface ISimplePeerOptions {
  initiator: boolean;
  trickle?: boolean;
}

export abstract class Connection {
  private readonly _id: number;
  private _isConnected: boolean;
  private _subject: Subject<IConnectionEvent>;
  protected _signalData: SimplePeer.SignalData;
  private _waitForSignalPromise: Promise<SimplePeer.SignalData>;
  private _waitForSignalPromiseResolver: (data: SimplePeer.SignalData) => void;
  protected connection: SimplePeer.Instance;

  protected constructor(simplePeerOption: any, extendedOpts: any) {
    for (const key in extendedOpts) {
      if (extendedOpts.hasOwnProperty(key)) {
        simplePeerOption[key] = extendedOpts[key];
      }
    }
    this._subject = new Subject();
    this._waitForSignalPromise = new Promise<SimplePeer.SignalData>((resolve) => {
      this._waitForSignalPromiseResolver = resolve;
    });
    this._id = Utils.getRandomInt(0, 1000);
    this.setup(simplePeerOption);
  }

  protected abstract onSignal(data: SimplePeer.SignalData): void;

  protected waitForSignal(): Promise<SimplePeer.SignalData> {
    if (this._signalData) {
      return Promise.resolve(this._signalData);
    } else {
      return this._waitForSignalPromise;
    }
  }

  private setup(simplePeerOption: ISimplePeerOptions) {
    this.connection = new SimplePeer(simplePeerOption);
    this.bindConnectionListeners();
  }

  private bindConnectionListeners() {
    this.connection.on('signal', (data) => {
      this._signalData = data;
      this.onSignal(data);
      this._subject.next({
        type: ConnectionEventTypes.SETUP
      });
      this._waitForSignalPromiseResolver(data);
    });

    this.connection.on('connect', () => {
      this._isConnected = true;

      this._subject.next({
        type: ConnectionEventTypes.CONNECT
      });
    });

    this.connection.on('data', (message) => {
      this._subject.next({
        type: ConnectionEventTypes.MESSAGE,
        body: new Message(this._id, JSON.parse(message.toString()))
      });
    });

    this.connection.on('stream', (stream) => {
      console.log('GOT STREAM');
      this._subject.next({
        type: ConnectionEventTypes.CONNECT,
        body: stream
      });
      this._subject.next({
        type: ConnectionEventTypes.STREAM,
        body: stream
      });
    });

    this.connection.on('error', (err) => {
      console.warn(err);
      this._subject.next({
        type: ConnectionEventTypes.ERROR,
        body: err
      });
      this._subject.next({
        type: ConnectionEventTypes.CLOSE
      });
    });

    this.connection.on('close', () => {
      this._subject.next({
        type: ConnectionEventTypes.CLOSE
      });
    });
  }

  public getId() {
    return this._id;
  }

  public send(message: any, type: string = 'message') {
    if (this._isConnected) {
      this.connection.send(JSON.stringify({type: type, content: message}));
    }
  }

  public observe() {
    return this._subject;
  }
}
