import {Component, OnInit} from '@angular/core';
import {DirectedGraphModel} from '../../../shared/components/d3-directed-graph/models/directed-graph-model';
import {EdgeModel} from '../../../shared/components/d3-directed-graph/models/edge-model';
import {NodeModel} from '../../../shared/components/d3-directed-graph/models/node-model';
import {MeshImportEdgeModel} from '../../src/mesh-import-edge-model';
import {MeshImportNodeModel} from '../../src/mesh-import-node-model';

@Component({
  selector: 'app-mesh-visualizer',
  templateUrl: './mesh-visualizer.html',
  styleUrls: ['./mesh-visualizer.scss']
})
export class MeshVisualizerComponent implements OnInit {
  private static maxImportData = 10;
  public json: {};
  public directedGraphModel: DirectedGraphModel<NodeModel, EdgeModel>;
  public directedGraphModels: Array<DirectedGraphModel<NodeModel, EdgeModel>>;
  public snapshotNumber = 1;

  constructor() {
    this.directedGraphModels = [];
  }

  private resolveDirectedGraphModel(meshDump: any) {
    const model = new DirectedGraphModel();
    model.addNode(new MeshImportNodeModel({
      id: 'signal',
      roles: ['signal'],
      connections: {}
    }));
    meshDump.forEach((item: any) => {
      model.addNode(new MeshImportNodeModel(item));
      if (typeof item.connections === 'object') {
        let index = 0;
        Object.entries(item.connections).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((target) => {
              // TODO Remove, just for backwards compatibility
              if (typeof target === 'string') {
                target = {
                  id: target
                };
              }
              if (meshDump.find(node => node.id === target.id)) {
                model.addEdge(new MeshImportEdgeModel(item.id, target.id, target.state, key, index));
              }
            });
            if (value.length > 0) {
              index++;
            }
          }
        });
      }
    });
    this.directedGraphModels.push(model);
  }

  public updateMesh(data: any) {
    if (Array.isArray(data)) {
      if (data[0] && typeof data[0].id === 'string') {
        this.resolveDirectedGraphModel(data);
      } else if (data[0] && Array.isArray(data[0])) {
        const restricted = Math.max(0, data.length - MeshVisualizerComponent.maxImportData);
        data = data.splice(restricted);
        data.forEach((snapshot) => {
          if (Array.isArray(snapshot) && snapshot[0] && typeof snapshot[0].id === 'string') {
            this.resolveDirectedGraphModel(snapshot);
          }
        });
      }
      this.setDirectedGraphModel(0);
    }
  }

  public setDirectedGraphModel(index: number) {
    const existingModel = this.directedGraphModels[index];
    if (existingModel) {
      this.directedGraphModel = existingModel;
    }
    this.snapshotNumber = index + 1;
  }

  ngOnInit(): void {
  }
}
