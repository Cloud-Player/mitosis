import {HashLocationStrategy, LocationStrategy} from '@angular/common';
import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MeshImportModule} from '../mesh-import/mesh-import.module';
import {SharedModule} from '../shared/shared.module';
import {SimulationModule} from '../simulation/simulation.module';
import {MainComponent} from './components/main/main';
import {MainRoutingModule} from './main.routes';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,

    SimulationModule,
    MeshImportModule,
    SharedModule,

    MainRoutingModule
  ],
  declarations: [
    MainComponent
  ],
  providers: [
    { provide: LocationStrategy, useClass: HashLocationStrategy }
  ],
  bootstrap: [MainComponent]
})
export class MainModule {
}
