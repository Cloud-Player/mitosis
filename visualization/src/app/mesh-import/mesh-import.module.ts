import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SharedModule} from '../shared/shared.module';
import {MeshRealtimeVisualizerComponent} from './components/mesh-realtime-visualizer/mesh-realtime-visualizer';
import {MeshVisualizerComponent} from './components/mesh-visualizer/mesh-visualizer';
import {MeshImportRoutingModule} from './mesh-import.routes';
import {SocketListenerService} from './services/socket-listener';

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
    MeshVisualizerComponent,
    MeshRealtimeVisualizerComponent
  ],
  providers: [
    SocketListenerService
  ]
})
export class MeshImportModule {
}
