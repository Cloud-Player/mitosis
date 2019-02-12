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
import {PeerTableComponent} from './components/sidebar/peer-table/peer-table';
import {SidebarComponent} from './components/sidebar/sidebar';
import {SimulationComponent} from './components/simulation/simulation';
import {MainRoutingModule} from './main.routes';
import {LogEventLogger} from './services/log-event-logger';
import {MessageEventLogger} from './services/message-event-logger';
import {ScenarioSelectorComponent} from './components/sidebar/scenario-selector/scenario-selector';
import {StatsComponent} from './components/sidebar/stats/stats';
import {D3LineChartComponent} from './components/d3-line-chart/d3-line-chart';

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
    D3LineChartComponent,
    SimulationComponent,
    ScenarioSelectorComponent,
    SidebarComponent,
    NodeSettingsComponent,
    MessagesComponent,
    PeerTableComponent,
    NodeSettingsComponent,
    LoggerComponent,
    StatsComponent
  ],
  providers: [
    LogEventLogger,
    MessageEventLogger
  ],
  bootstrap: [MainComponent]
})
export class MainModule {
}
