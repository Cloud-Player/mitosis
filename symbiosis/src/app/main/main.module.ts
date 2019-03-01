import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SharedModule} from '../shared/shared.module';
import {ControlsComponent} from './components/controls/controls';
import {MainComponent} from './components/main/main';
import {MessengerComponent} from './components/messenger/messenger';
import {PeerTableComponent} from './components/sidebar/peer-table/peer-table';
import {SidebarComponent} from './components/sidebar/sidebar';
import {StreamPlayerComponent} from './components/stream-player/stream-player';
import {MainRoutingModule} from './main.routes';
import {StreamService} from './services/stream';
import {ReportingService} from './services/reporting';

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
    SidebarComponent,
    PeerTableComponent,
    MessengerComponent,
    StreamPlayerComponent,
    ControlsComponent
  ],
  providers: [
    StreamService,
    ReportingService
  ],
  bootstrap: [MainComponent]
})
export class MainModule {
}
