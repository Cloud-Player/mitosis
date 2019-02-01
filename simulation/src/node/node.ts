import {IConnection, Mitosis} from 'mitosis';
import {MockConnection} from '../connection/mock';
import {Edge} from '../edge/edge';

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
    this._mitosis
      .getPeerTable()
      .forEach(
        peer => {
          peer
            .getConnectionTable()
            .filterDirect()
            .forEach(
              (connection: MockConnection) => {
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
