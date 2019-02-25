import {EdgeModel} from '../../shared/components/d3-directed-graph/models/edge-model';
import {D3DirectedGraphConfig} from '../../shared/src/d3-directed-graph-config';

export class MeshImportEdgeModel extends EdgeModel {
  private _connection: string;

  constructor(sourceId: string, targetId: string, connection: string, offset: number) {
    super(sourceId, targetId, '', offset);
    this._connection = connection;
  }

  public getConnectionPrefix(): string {
    return this._connection;
  }

  public strokeColorTransformer(): string {
    if (this._connection === 'webrtc-stream') {
      return D3DirectedGraphConfig.CONNECTION_STREAM_COLOR;
    } else {
      return super.strokeColorTransformer();
    }
  }
}
