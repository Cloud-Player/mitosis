import {Connection} from '../connection/connection';
import {Manager} from './manager';

export class Peer {
  private _id: number;
  private _connections: Array<Connection>;
  private _manager: Manager;
  private _publicKey: string;

  public constructor(manager: Manager) {
    this._connections = [];
    this._manager = manager;
  }

  public getId(): number {
    return this._id;
  }

  public getConnections(): Array<Connection> {
    return this._connections;
  }

  public getPublicKey(): string {
    return this._publicKey;
  }

  public send(message: any): void {
    //this._manager.getBestConnection(this._id).send(message);
  }
}
