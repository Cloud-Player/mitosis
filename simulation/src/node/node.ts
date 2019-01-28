import {IConnection, Mitosis} from 'mitosis';
import {Edge} from '../edge/edge';
import {MockConnection} from '../connection/mock';

export class Node {
  private _mitosis: Mitosis;
  private _isSelected: boolean;
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
    this._mitosis.getPeerManager().getPeers().forEach((peer) => {
      peer.getConnectionTable().filterDirect().asArray().forEach((connection: MockConnection) => {
        edges.push(new Edge(this.getId(), connection));
      });
    });
    return edges;
  }

  public getId() {
    return this._mitosis.getMyAddress().getId();
  }

  public setSelected(isSelected: boolean) {
    this._isSelected = isSelected;
  }

  public isSelected() {
    return this._isSelected;
  }
}
