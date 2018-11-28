import * as SimplePeer from 'simple-peer';
import {Connection, ConnectionEventTypes, IConnectionEvent} from './connection';

export class ConnectionOut extends Connection {
  private _offer: SimplePeer.SignalData = {};

  constructor() {
    super({
      initiator: true,
      trickle: false
    });
  }

  protected onSignal(data: SimplePeer.SignalData): void {
    this._offer = data;
  }

  public establish(answer: { type: string, sdp: any }) {
    this._signalData = null;
    this.connection.signal(answer);
    return this.waitForSignal();
  }

  public getOffer() {
    return this._offer;
  }
}
