import {EdgeModel} from './edge-model';
import {NodeModel} from './node-model';

export class DirectedGraphModel<TNode extends NodeModel, TEdge extends EdgeModel> {
  private _nodes: Array<TNode>;
  private _edges: Array<TEdge>;
  private _events: { [key: string]: Array<() => void> };

  constructor() {
    this._nodes = [];
    this._edges = [];
    this._events = {};
  }

  private triggerEv(key) {
    if (this._events[key]) {
      this._events[key].forEach((fn) => {
        fn();
      });
    }
  }

  private trigger(keys: Array<string>) {
    keys.forEach(key => this.triggerEv(key));
  }

  private onKey(key: string, callback: () => void) {
    if (this._events[key]) {
      this._events[key].push(callback);
    } else {
      this._events[key] = [callback];
    }
  }

  private canAddEdge(newEdge: TEdge, existingTargetEdge: TEdge, existingSourceEdge: TEdge): boolean {
    if (!existingTargetEdge && !existingSourceEdge) {
      return true;
    } else {
      return false;
    }
  }

  public on(key: string, callback: () => void) {
    const keys = key.split(' ');
    keys.forEach(evKey => this.onKey(evKey, callback));
  }

  public getNode(searchNode: TNode): TNode {
    return this._nodes.find((node) => {
      return node.getId() === searchNode.getId();
    });
  }

  public getEdge(searchEdge: TEdge) {
    return this._edges.find((edge: TEdge) => {
      return edge.getId() === searchEdge.getId() && edge.getLocation() === searchEdge.getLocation();
    });
  }

  public addNode(node: TNode): TNode {
    let existingNode = this.getNode(node);
    if (!existingNode) {
      this._nodes.push(node);
      existingNode = node;
      this.trigger(['add', 'add-node']);
    }
    return existingNode;
  }

  public addEdge(edge: TEdge): TEdge {
    const existingTargetNode = this._edges.find(
      findEdge => findEdge.matches(edge.getConnectionPrefix(), edge.getTargetId(), edge.getSourceId(), edge.getLocation())
    );
    const existingSourceNode = this.getEdge(edge);

    const isNew = this.canAddEdge(edge, existingTargetNode, existingSourceNode);
    if (isNew) {
      this._edges.push(edge);
      this.trigger(['add', 'add-edge']);
    }
    return edge;
  }

  public getNodes() {
    return this._nodes;
  }

  public getEdges() {
    return this._edges;
  }

  public reset() {
    this._nodes = [];
    this._edges = [];
  }
}
