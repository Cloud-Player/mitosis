import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SharedModule} from '../shared/shared.module';
import {MainComponent} from './components/main/main';
import {RecordStreamButtonComponent} from './components/record-stream-button/record-stream-button';
import {PeerTableComponent} from './components/sidebar/peer-table/peer-table';
import {SidebarComponent} from './components/sidebar/sidebar';
import {StreamPlayerComponent} from './components/stream-player/stream-player';
import {MainRoutingModule} from './main.routes';
import {MessengerComponent} from './components/messenger/messenger';

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
    RecordStreamButtonComponent
  ],
  providers: [
  ],
  bootstrap: [MainComponent]
})
export class MainModule {
}
