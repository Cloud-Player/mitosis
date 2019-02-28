import {Component, OnInit} from '@angular/core';
import {DirectedGraphModel} from '../../../shared/components/d3-directed-graph/models/directed-graph-model';
import {SocketListenerService} from '../../services/socket-listener';
import {MeshImportEdgeModel} from '../../src/mesh-import-edge-model';
import {MeshImportNodeModel} from '../../src/mesh-import-node-model';

@Component({
  selector: 'app-mesh-realtime-visualizer',
  templateUrl: './mesh-realtime-visualizer.html',
  styleUrls: ['./mesh-realtime-visualizer.scss']
})
export class MeshRealtimeVisualizerComponent implements OnInit {
  public json: {};
  public directedGraphModel: DirectedGraphModel<MeshImportNodeModel, MeshImportEdgeModel>;

  constructor(private socketListenerService: SocketListenerService) {
    this.directedGraphModel = new DirectedGraphModel();
  }

  private static addConnectionsToModel(connections: { [key: string]: Array<string> },
                                       source: string,
                                       model: DirectedGraphModel<MeshImportNodeModel, MeshImportEdgeModel>) {
    let index = 0;
    Object.entries(connections).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((target) => {
          model.addEdge(new MeshImportEdgeModel(source, target, key, index));
        });
        if (value.length > 0) {
          index++;
        }
      }
    });
  }

  public updateMesh(item: any) {
    const model: DirectedGraphModel<MeshImportNodeModel, MeshImportEdgeModel> = new DirectedGraphModel();

    this.directedGraphModel
      .getNodes()
      .forEach(previousNode => {
        const isSignalNode = previousNode.getMeshImportNode().roles.indexOf('signal') !== -1;
        if (!previousNode.isExpired() || isSignalNode) {
          model.addNode(previousNode);
          MeshRealtimeVisualizerComponent.addConnectionsToModel(
            previousNode.getMeshImportNode().connections,
            previousNode.getId(),
            model
          );
        }
      });

    if (item.id) {
      const newNode = new MeshImportNodeModel(item);
      const existingNode = model.getNodeById(item.id);
      if (existingNode) {
        newNode.x = existingNode.x;
        newNode.y = existingNode.y;
        model.removeNode(existingNode);
      }
      model.addNode(newNode);

      if (typeof item.connections === 'object') {
        MeshRealtimeVisualizerComponent.addConnectionsToModel(
          item.connections,
          newNode.getId(),
          model
        );
      }
    }

    this.directedGraphModel = model;
  }

  ngOnInit(): void {
    // Make sure to show signal as the signal is not rporting itself
    this.directedGraphModel.addNode(new MeshImportNodeModel({
      id: 'p000',
      roles: ['signal'],
      connections: {}
    }));
    this.socketListenerService.start();
    this.socketListenerService.observe().subscribe(this.updateMesh.bind(this));
    setInterval(() => {
      this.updateMesh({});
    }, 5000);
  }
}
