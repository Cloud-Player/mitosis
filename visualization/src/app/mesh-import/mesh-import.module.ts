import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SharedModule} from '../shared/shared.module';
import {MeshVisualizerComponent} from './components/mesh-visualizer/mesh-visualizer';
import {MeshImportRoutingModule} from './mesh-import.routes';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,

    SharedModule,

    MeshImportRoutingModule
  ],
  declarations: [
    MeshVisualizerComponent
  ],
  providers: []
})
export class MeshImportModule {
}
