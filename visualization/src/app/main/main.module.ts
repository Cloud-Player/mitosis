import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SharedModule} from '../shared/shared.module';
import {D3DirectedGraphComponent} from './components/d3-directed-graph/d3-directed-graph';
import {MainComponent} from './components/main/main';
import {LoggerComponent} from './components/sidebar/logger/logger';
import {MessagesComponent} from './components/sidebar/messages/messages';
import {NodeSettingsComponent} from './components/sidebar/node-settings/node-settings';
import {RoutingTableComponent} from './components/sidebar/routing-table/routing-table';
import {SidebarComponent} from './components/sidebar/sidebar';
import {SimulationComponent} from './components/simulation/simulation';
import {MainRoutingModule} from './main.routes';

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
    NodeSettingsComponent,
    MessagesComponent,
    RoutingTableComponent,
    NodeSettingsComponent,
    LoggerComponent
  ],
  providers: [],
  bootstrap: [MainComponent]
})
export class MainModule {
}
