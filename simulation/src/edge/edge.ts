import {MockConnection} from '../connection/mock';

export class Edge {
  public source: string;
  public target: string;
  private _connection: MockConnection;
  private _sourceId: string;
  private _id: string;

  constructor(sourceId: string, connection: MockConnection) {
    this._connection = connection;
    this._sourceId = sourceId;
    this._id = Edge.buildId(this._sourceId, this._connection.getAddress().getId());
    this.source = this._sourceId;
    this.target = this._connection.getAddress().getId();
  }

  private static buildId(sourceId: string, targetId: string): string {
    return `c-${sourceId}-${targetId}}`;
  }

  public getConnection(): MockConnection {
    return this._connection;
  }

  public equals(edge: Edge): boolean {
    return edge.getId() === this.getId();
  }

  public equalsSourceTarget(sourceId: string, targetId: string): boolean {
    return this.getId() === sourceId && this._connection.getAddress().getId() === targetId;
  }

  public getSourceId(): string {
    return this._sourceId;
  }

  public getId(): string {
    return this._id;
  }
}
