import {ConnectionState, Protocol} from 'mitosis';
import {EdgeModel} from '../../shared/components/d3-directed-graph/models/edge-model';
import {D3DirectedGraphConfig} from '../../shared/src/d3-directed-graph-config';

export class MeshImportEdgeModel extends EdgeModel {
  private _connection: string;
  private _state: string;

  constructor(sourceId: string, targetId: string, state: string, connection: string, offset: number) {
    super(sourceId, targetId, '', offset);
    this._connection = connection;
    this._state = state;
  }

  public getConnectionPrefix(): string {
    return this._connection;
  }

  public strokeColorTransformer(): string {
    if (this._state === ConnectionState.ERROR) {
      return D3DirectedGraphConfig.CONNECTION_ERROR_STROKE_COLOR;
    } else if ([ConnectionState.OPENING, ConnectionState.CLOSING].includes(this._state as ConnectionState)) {
      return D3DirectedGraphConfig.CONNECTION_CHANGING_STROKE_COLOR;
    } else if (this._connection === Protocol.WEBRTC_STREAM) {
      return D3DirectedGraphConfig.CONNECTION_ACTIVE_STREAM_COLOR;
    } else {
      return super.strokeColorTransformer();
    }
  }

  public strokeDashArrayTransformer(): Array<number> {
    if ([ConnectionState.CLOSING, ConnectionState.CLOSED].includes(this._state as ConnectionState)) {
      return D3DirectedGraphConfig.CONNECTION_CLOSING_STROKE_DASH;
    } else if (this._state === ConnectionState.OPENING) {
      return D3DirectedGraphConfig.CONNECTION_OPENING_STROKE_DASH;
    } else {
      return super.strokeDashArrayTransformer();
    }
  }
}
