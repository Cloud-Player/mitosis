import {RoleType} from 'mitosis';
import {NodeModel} from '../../shared/components/d3-directed-graph/models/node-model';
import {D3DirectedGraphConfig} from '../../shared/src/d3-directed-graph-config';

export interface IMeshImportNode {
  roles: Array<string>;
  id: string;
}

export class MeshImportNodeModel extends NodeModel {
  private _node: IMeshImportNode;

  constructor(node: IMeshImportNode) {
    super(node.id);
    this._node = node;
  }

  private hasRole(role: RoleType): boolean {
    return this._node.roles.indexOf(role) !== -1;
  }

  public getMeshImportNode() {
    return this._node;
  }

  public ellipseFillTransformer(): string {
    if (this.hasRole(RoleType.SIGNAL)) {
      return D3DirectedGraphConfig.NODE_ROLE_SIGNAL_FILL_COLOR;
    } else if (this.hasRole(RoleType.ROUTER)) {
      return D3DirectedGraphConfig.NODE_ROLE_ROUTER_FILL_COLOR;
    } else if (this.hasRole(RoleType.NEWBIE)) {
      return D3DirectedGraphConfig.NODE_ROLE_NEWBIE_FILL_COLOR;
    } else {
      return super.ellipseFillTransformer();
    }
  }
}
