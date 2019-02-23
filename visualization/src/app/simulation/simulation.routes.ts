import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {SimulationComponent} from './components/simulation/simulation';

const routes: Routes = [
  {path: 'simulation', component: SimulationComponent, pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class SimulationRoutingModule {
}
