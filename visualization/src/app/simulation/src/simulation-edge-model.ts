import {ConnectionState, IConnection, Protocol, WebRTCConnection} from 'mitosis';
import {EdgeModel} from '../../shared/components/d3-directed-graph/models/edge-model';
import {D3DirectedGraphConfig} from '../../shared/src/d3-directed-graph-config';

export class SimulationEdgeModel extends EdgeModel {
  private _connection: IConnection;

  constructor(sourceId: string, connection: IConnection, offset) {
    super(sourceId, connection.getAddress().getId(), connection.getAddress().getLocation(), offset);
    this._connection = connection;
  }

  private showDirectionArrow(): boolean {
    return this._connection.getAddress().isProtocol(Protocol.WEBRTC_STREAM) ||
      (
        this._connection.getAddress().isProtocol(Protocol.WEBRTC_DATA) &&
        this._connection.getState() === ConnectionState.OPENING
      );
  }

  public getConnection() {
    return this._connection;
  }

  public getConnectionPrefix() {
    return this._connection.getAddress().getProtocol();
  }

  public strokeColorTransformer(): string {
    if (this._connection.isInState(ConnectionState.ERROR)) {
      return D3DirectedGraphConfig.CONNECTION_ERROR_STROKE_COLOR;
    } else if (this._connection.isInState(ConnectionState.OPENING, ConnectionState.CLOSING)) {
      return D3DirectedGraphConfig.CONNECTION_CHANGING_STROKE_COLOR;
    } else if (this._connection.getAddress().getProtocol() === Protocol.WEBRTC_STREAM) {
      return D3DirectedGraphConfig.CONNECTION_STREAM_COLOR;
    } else {
      return super.strokeColorTransformer();
    }
  }

  public strokeDashArrayTransformer(): Array<number> {
    if (this._connection.isInState(ConnectionState.CLOSING, ConnectionState.CLOSED)) {
      return D3DirectedGraphConfig.CONNECTION_CLOSING_STROKE_DASH;
    } else if (this._connection.isInState(ConnectionState.OPENING)) {
      return D3DirectedGraphConfig.CONNECTION_OPENING_STROKE_DASH;
    } else {
      return super.strokeDashArrayTransformer();
    }
  }

  public showOutgoingArrowTransformer(): boolean {
    if (this.showDirectionArrow()) {
      return (this._connection as WebRTCConnection).isInitiator();
    }
  }

  public showIncomingArrowTransformer(): boolean {
    if (this.showDirectionArrow()) {
      return !(this._connection as WebRTCConnection).isInitiator();
    }
  }
}
