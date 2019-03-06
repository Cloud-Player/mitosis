import {Protocol, WebRTCConnection} from 'mitosis';
import {DirectedGraphModel} from '../../shared/components/d3-directed-graph/models/directed-graph-model';
import {SimulationEdgeModel} from './simulation-edge-model';
import {SimulationNodeModel} from './simulation-node-model';

export class SimulationDirectedGraphModel extends DirectedGraphModel<SimulationNodeModel, SimulationEdgeModel> {

  public addEdge(edge: SimulationEdgeModel): SimulationEdgeModel {
    if (!this.getNodeById(edge.getSourceId()) || !this.getNodeById(edge.getTargetId())) {
      return null;
    }
    const existingEdge = this.findEdge(edge.getConnectionPrefix(), edge.getSourceId(), edge.getTargetId(), edge.getLocation());
    if (existingEdge) {
      // If the connection already exists, make sure the initiator is set on the edge
      [existingEdge, edge]
        .filter(
          value => {
            if (value.getConnection().getAddress().isProtocol(Protocol.WEBRTC_DATA, Protocol.WEBRTC_STREAM)) {
              return (value.getConnection() as WebRTCConnection).isInitiator();
            }
          }
        )
        .forEach(
          value => existingEdge.setConnection(value.getConnection())
        );
      return existingEdge;
    } else {
      this._edges.push(edge);
      this.trigger(['add', 'add-edge']);
      return edge;
    }
  }
}
