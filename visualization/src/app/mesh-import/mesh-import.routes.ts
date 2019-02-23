import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {MeshVisualizerComponent} from './components/mesh-visualizer/mesh-visualizer';

const routes: Routes = [
  {path: 'mesh-import', component: MeshVisualizerComponent, pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class MeshImportRoutingModule {
}
