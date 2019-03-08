import {RoleType} from 'mitosis';
import {NodeModel} from '../../shared/components/d3-directed-graph/models/node-model';
import {D3DirectedGraphConfig} from '../../shared/src/d3-directed-graph-config';

export interface IMeshImportNode {
  x?: number;
  y?: number;
  roles: Array<string>;
  id: string;
  connections: { [key: string]: Array<string> };
}

export class MeshImportNodeModel extends NodeModel {
  private _node: IMeshImportNode;
  private _lastSeen: number;

  constructor(node: IMeshImportNode) {
    super(node.id);
    this._node = node;
    this._lastSeen = +new Date();
    this.x = node.x;
    this.y = node.y;
  }

  private hasRole(role: RoleType): boolean {
    return this._node.roles.indexOf(role) !== -1;
  }

  public setNode(node: IMeshImportNode) {
    this._node = node;
  }

  public getMeshImportNode() {
    return this._node;
  }

  public isExpired() {
    return +new Date() - this._lastSeen >= 4000;
  }

  public updateLastSeen() {
    this._lastSeen = +new Date();
  }

  public ellipseFillTransformer(selectedNode: MeshImportNodeModel): string {
    if (this.hasRole(RoleType.SIGNAL)) {
      return D3DirectedGraphConfig.NODE_ROLE_SIGNAL_FILL_COLOR;
    } else if (this.hasRole(RoleType.ROUTER)) {
      return D3DirectedGraphConfig.NODE_ROLE_ROUTER_FILL_COLOR;
    } else if (this.hasRole(RoleType.NEWBIE)) {
      return D3DirectedGraphConfig.NODE_ROLE_NEWBIE_FILL_COLOR;
    } else {
      return super.ellipseFillTransformer(selectedNode);
    }
  }
}
