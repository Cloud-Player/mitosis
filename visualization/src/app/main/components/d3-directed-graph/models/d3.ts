import {NodeModel} from './node';
import {EdgeModel} from './edge';

export class D3Model {
  private _nodes: Array<NodeModel>;
  private _edges: Array<EdgeModel>;

  constructor() {
    this._nodes = [];
    this._edges = [];
  }

  public getNodeById(id: string) {
    return this._nodes.find((node) => {
      return node.getId() === id;
    });
  }

  public getEdge(sourceId: string, targetId: string) {
    return this._edges.find((edge) => {
      return edge.getSource() === sourceId && edge.getTarget() === targetId;
    });
  }

  public addNode(node: NodeModel): NodeModel {
    let existingNode = this.getNodeById(node.getId());
    if (!existingNode) {
      this._nodes.push(node);
      existingNode = node;
    }
    return existingNode;
  }

  public addEdge(sourceId: string, targetId: string): EdgeModel {
    let existingEdge = this.getEdge(sourceId, targetId);
    if (!existingEdge) {
      const edge = new EdgeModel(sourceId, targetId);
      this._edges.push(edge);
      existingEdge = edge;
    } else {
      existingEdge.increaseConnectionAmount();
    }
    return existingEdge;
  }

  public getNodes() {
    const nodes = [];
    this._nodes.forEach((node) => {
      nodes.push({
        id: node.getId(),
        size: 10
      });
    });
    return nodes;
  }

  public getEdges() {
    const edges = [];
    this._edges.forEach((node) => {
      edges.push({
        source: node.getSource(),
        target: node.getTarget(),
        weight: node.getConnectionAmount()
      });
    });
    return edges;
  }
}
