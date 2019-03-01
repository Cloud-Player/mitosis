import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {MeshRealtimeVisualizerComponent} from './components/mesh-realtime-visualizer/mesh-realtime-visualizer';
import {MeshVisualizerComponent} from './components/mesh-visualizer/mesh-visualizer';

const routes: Routes = [
  {path: 'mesh-import', component: MeshVisualizerComponent, pathMatch: 'full'},
  {path: 'mesh-realtime', component: MeshRealtimeVisualizerComponent, pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class MeshImportRoutingModule {
}
