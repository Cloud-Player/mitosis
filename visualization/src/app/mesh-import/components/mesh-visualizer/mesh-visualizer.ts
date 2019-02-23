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

  constructor() {
  }

  public updateMesh(data: any) {
    if (Array.isArray(data)) {
      const model = new DirectedGraphModel();
      data.forEach((item: any) => {
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
      this.directedGraphModel = model;
    }
  }

  ngOnInit(): void {
  }
}
