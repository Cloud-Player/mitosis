import {EdgeModel} from './edge-model';
import {NodeModel} from './node-model';

export class DirectedGraphModel<TNode extends NodeModel, TEdge extends EdgeModel> {

  protected _nodes: Array<TNode>;
  protected _edges: Array<TEdge>;
  protected _events: { [key: string]: Array<() => void> };

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

  protected trigger(keys: Array<string>) {
    keys.forEach(key => this.triggerEv(key));
  }

  private onKey(key: string, callback: () => void) {
    if (this._events[key]) {
      this._events[key].push(callback);
    } else {
      this._events[key] = [callback];
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

  public getNodeById(nodeId: string): TNode {
    return this._nodes.find(node => node.getId() === nodeId);
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

  public removeNode(node: TNode) {
    const existingNode = this.getNode(node);
    if (existingNode) {
      this._nodes.splice(this._nodes.indexOf(existingNode), 1);
      this.trigger(['remove', 'remove-node']);
    }
  }

  public findEdge(prefix: string, sourceId: string, targetId: string, location: string): TEdge {
    return this._edges
      .find(
      value =>
        value.matches(prefix, sourceId, targetId, location) ||
        value.matches(prefix, targetId, sourceId, location)
      );
  }

  public addEdge(edge: TEdge): TEdge {
   const existingEdge = this.findEdge(edge.getConnectionPrefix(), edge.getSourceId(), edge.getTargetId(), edge.getLocation());
    if (existingEdge) {
      return existingEdge;
    } else {
      this._edges.push(edge);
      this.trigger(['add', 'add-edge']);
      return edge;
    }
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
