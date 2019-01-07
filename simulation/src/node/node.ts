import {IConnection, Mitosis} from 'mitosis';
import {Edge} from '../edge/edge';

export class Node {
  private _mitosis: Mitosis;
  public x: number;
  public y: number;

  constructor(mitosis: Mitosis) {
    this._mitosis = mitosis;
  }

  public getMitosis() {
    return this._mitosis;
  }

  public getEdges() {
    const edges: Array<Edge> = [];
    this._mitosis.getRoutingTable().getPeers().forEach((peer) => {
      peer.getConnectionTable().filterDirect().asArray().forEach((connection) => {
        edges.push(new Edge(this.getId(), connection));
      });
    });
    return edges;
  }

  public getId() {
    return this._mitosis.getMyAddress().getId();
  }
}
