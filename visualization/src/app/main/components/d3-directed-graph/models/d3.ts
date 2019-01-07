import {Node, Edge} from 'mitosis-simulation';

export class D3Model {
  private _nodes: Array<Node>;
  private _edges: Array<Edge>;
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

  public on(key: string, callback: () => void) {
    const keys = key.split(' ');
    keys.forEach(evKey => this.onKey(evKey, callback));
  }

  public getNode(searchNode: Node) {
    return this._nodes.find((node) => {
      return node.getId() === searchNode.getId();
    });
  }

  public getEdge(searchEdge: Edge) {
    return this._edges.find((edge: Edge) => {
      return edge.equals(searchEdge);
    });
  }

  public addNode(node: Node): Node {
    let existingNode = this.getNode(node);
    if (!existingNode) {
      this._nodes.push(node);
      existingNode = node;
      this.trigger(['add', 'add-node']);
    }
    return existingNode;
  }

  public addEdge(edge: Edge): Edge {
    let existingEdge = this.getEdge(edge);
    if (!existingEdge) {
      this._edges.push(edge);
      existingEdge = edge;
      this.trigger(['add', 'add-edge']);
    }
    return existingEdge;
  }

  public getNodes() {
    return this._nodes;
  }

  public getEdges() {
    return this._edges;
  }
}
