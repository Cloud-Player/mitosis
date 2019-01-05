export class NodeModel {
  private _id: string;
  private _edges: Array<string>;

  constructor(id?: string, connectedWith?: Array<string>) {
    if (id) {
      this._id = id;
    } else {
      this._id = `p${Math.round(100 + Math.random() * 899)}`;
    }

    if (connectedWith) {
      this._edges = connectedWith;
    } else {
      this._edges = [];
    }
  }

  public getEdges(): Array<string> {
    return this._edges;
  }

  public getId() {
    return this._id;
  }
}
