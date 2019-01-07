import {IConnection} from 'mitosis';

export class Edge {
  private _connection: IConnection;
  private _sourceId: string;
  private _id: string;
  public source: string;
  public target: string;

  private static buildId(sourceId: string, targetId: string) {
    return `c-${sourceId}-${targetId}}`;
  }

  constructor(sourceId: string, connection: IConnection) {
    this._connection = connection;
    this._sourceId = sourceId;
    this._id = Edge.buildId(this._sourceId, this._connection.getAddress().getId());
    this.source = this._sourceId;
    this.target = this._connection.getAddress().getId();
  }

  public getConnection() {
    return this._connection;
  }

  public equals(edge: Edge) {
    return edge.getId() === this.getId();
  }

  public equalsSourceTarget(sourceId: string, targetId: string) {
    return this.getId() === sourceId && this._connection.getAddress().getId() === targetId;
  }

  public getId() {
    return this._id;
  }
}
