import {Connection} from '../connection/connection';

export class Manager {

  private _connections: Array<Connection>;

  constructor() {
    this._connections = [];
  }

  public getBestConnection(to: number): Connection {
    return this._connections.sort((a, b) => a.getQuality() - b.getQuality()).shift();
  }
}
