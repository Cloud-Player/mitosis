import * as SimplePeer from 'simple-peer';
import {Connection, ConnectionEventTypes, IConnectionEvent} from './connection';

export class ConnectionIn extends Connection {
  private _answer: SimplePeer.SignalData = {};

  constructor() {
    super({
      initiator: false,
      trickle: false
    }, {});
  }

  protected onSignal(data: SimplePeer.SignalData): void {
    this._answer = data;
  }

  public requestAnswer(offer: SimplePeer.SignalData) {
    this._signalData = null;
    this.connection.signal(offer);
    return this.waitForSignal();
  }

  public getAnswer() {
    return this._answer;
  }
}
