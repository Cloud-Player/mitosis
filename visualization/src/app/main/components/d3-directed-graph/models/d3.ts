import {NodeModel} from './node';
import {EdgeModel} from './edge';

export interface ID3Node {
  id: string;
  size: number;
}

export interface ID3Edge {
  id: string;
  source: string;
  target: string;
  weight: number;
}

export class D3Model {
  private _nodes: Array<NodeModel>;
  private _edges: Array<EdgeModel>;
  private _d3Nodes: Array<ID3Node>;
  private _d3Edges: Array<ID3Edge>;
  private _events: { [key: string]: Array<() => void> };

  constructor() {
    this._nodes = [];
    this._edges = [];
    this._d3Nodes = [];
    this._d3Edges = [];
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

  public addNode(nodeId: string): NodeModel {
    let existingNode = this.getNodeById(nodeId);
    if (!existingNode) {
      const node = new NodeModel(nodeId);
      this._nodes.push(node);
      this._d3Nodes.push({
        id: node.getId(),
        size: 10
      });
      existingNode = node;
      this.trigger(['add', 'add-node']);
    }
    return existingNode;
  }

  public addEdge(sourceId: string, targetId: string): EdgeModel {
    let existingEdge = this.getEdge(sourceId, targetId);
    if (!existingEdge) {
      const edge = new EdgeModel(sourceId, targetId);
      this._edges.push(edge);
      this._d3Edges.push({
        id: `c${edge.getSource()}-${edge.getTarget()}`,
        source: edge.getSource(),
        target: edge.getTarget(),
        weight: 1
      });
      existingEdge = edge;
      this.trigger(['add', 'add-edge']);
    } else {
      existingEdge.increaseConnectionAmount();
      const existingD3Edge = this._d3Edges.find((d3Edge) => {
        return d3Edge.target === existingEdge.getTarget() && d3Edge.source === existingEdge.getSource();
      });
      existingD3Edge.weight++;
      this.trigger(['update', 'update-edge']);
    }
    return existingEdge;
  }

  public getD3Nodes() {
    return this._d3Nodes;
  }

  public getD3Edges() {
    return this._d3Edges;
  }
}
