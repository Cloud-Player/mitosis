import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MainComponent} from './components/main/main';
import {HashLocationStrategy, LocationStrategy} from '@angular/common';
import {MainRoutingModule} from './main.routes';
import {HttpClientModule} from '@angular/common/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule} from '@angular/router';
import {D3DirectedGraphComponent} from './components/d3-directed-graph/d3-directed-graph';
import {SimulationComponent} from './components/simulation/simulation';
import {SharedModule} from '../shared/shared.module';
import {SidebarComponent} from './components/sidebar/sidebar';
import {MatButtonModule, MatMenuModule, MatSelectModule} from '@angular/material';
import {RoutingtableComponent} from './components/sidebar/routingtable/routingtable';
import {NodeSettingsComponent} from './components/sidebar/node-settings/node-settings';


@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,

    SharedModule,

    MainRoutingModule
  ],
  declarations: [
    MainComponent,
    D3DirectedGraphComponent,
    SimulationComponent,
    SidebarComponent,
    RoutingtableComponent,
    NodeSettingsComponent
  ],
  providers: [],
  bootstrap: [MainComponent]
})
export class MainModule {
}
