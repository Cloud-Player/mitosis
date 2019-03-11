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
  public json: {};
  public directedGraphModel: DirectedGraphModel<NodeModel, EdgeModel>;
  public directedGraphModels: Array<DirectedGraphModel<NodeModel, EdgeModel>>;
  public snapshotNumber = 1;

  constructor() {
    this.directedGraphModels = [];
  }

  private resolveDirectedGraphModel(meshDump: any) {
    const model = new DirectedGraphModel();
    meshDump.forEach((item: any) => {
      model.addNode(new MeshImportNodeModel(item));
      if (typeof item.connections === 'object') {
        let index = 0;
        Object.entries(item.connections).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((target) => {
              model.addEdge(new MeshImportEdgeModel(item.id, target, key, index));
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
        data.forEach((snapshot) => {
          // if (Array.isArray(snapshot) && snapshot[0] && typeof snapshot[0] === 'string') {
          this.resolveDirectedGraphModel(snapshot);
          // }
        });
      }
      this.setDirectedGraphModel(1);
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
