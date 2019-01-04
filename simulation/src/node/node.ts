import {IConnection, Mitosis} from 'mitosis';

export class Device {
  private _mitosis: Mitosis;

  constructor() {
    this._mitosis = new Mitosis();
  }

  public getEdges() {
    const connections: Array<IConnection> = [];
    this._mitosis.getRoutingTable().getPeers().forEach((peer) => {
      peer.getConnectionTable().filterDirect().asArray().forEach((connection) => {
        connections.push(connection);
      });
    });
    return connections;
  }
}
