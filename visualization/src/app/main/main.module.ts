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


@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,

    MainRoutingModule
  ],
  declarations: [
    MainComponent,
    D3DirectedGraphComponent,
    SimulationComponent
  ],
  providers: [],
  bootstrap: [MainComponent]
})
export class MainModule {
}
