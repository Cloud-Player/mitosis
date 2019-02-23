import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SharedModule} from '../shared/shared.module';
import {LoggerComponent} from './components/sidebar/logger/logger';
import {MessagesComponent} from './components/sidebar/messages/messages';
import {NodeSettingsComponent} from './components/sidebar/node-settings/node-settings';
import {PeerTableComponent} from './components/sidebar/peer-table/peer-table';
import {ScenarioSelectorComponent} from './components/sidebar/scenario-selector/scenario-selector';
import {SidebarComponent} from './components/sidebar/sidebar';
import {StatsComponent} from './components/sidebar/stats/stats';
import {SimulationComponent} from './components/simulation/simulation';
import {LogEventLogger} from './services/log-event-logger';
import {SimulationRoutingModule} from './simulation.routes';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,

    SharedModule,

    SimulationRoutingModule
  ],
  declarations: [
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
    LogEventLogger
  ]
})
export class SimulationModule {
}
