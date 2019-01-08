import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {NgModule} from '@angular/core';
import {ScrollViewComponent} from './components/scroll-view/scroll-view.component';
import {FillHeightDirective} from './directives/fill-height';
import {LayoutService} from './services/layout';
import {TabBarComponent} from './components/tabs/tab-bar/tab-bar';
import {TabPaneComponent} from './components/tabs/tab-pane/tab-pane';
import {HTTP_INTERCEPTORS} from '@angular/common/http';
import {ModalHolderComponent} from './components/modal/modal-holder/modal-holder';
import {ModalComponent} from './components/modal/modal/modal';
import {Modal} from './src/modal-factory.class';
import {ModalService} from './services/modal';
import {FormsModule} from '@angular/forms';
import {HeaderComponent} from './components/ui/header/header';
import {ConfirmDeleteDirective} from './directives/confirm-delete';
import {ConfirmDeleteComponent} from './components/confirm-delete/confirm-delete';
import {TimeAgoDirective} from './directives/time-ago.directive';
import {SearchInputComponent} from './components/ui/inputs/search/search';
import {MatAutocompleteModule, MatButtonModule, MatInputModule} from '@angular/material';
import {ButtonComponent} from './components/ui/inputs/button/button';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatAutocompleteModule
  ],
  exports: [
    ScrollViewComponent,

    TabBarComponent,
    TabPaneComponent,

    ModalHolderComponent,
    ModalComponent,

    HeaderComponent,
    SearchInputComponent,
    ButtonComponent,

    FillHeightDirective,
    ConfirmDeleteDirective,
    TimeAgoDirective
  ],
  declarations: [
    ScrollViewComponent,
    ConfirmDeleteComponent,

    TabBarComponent,
    TabPaneComponent,

    ModalHolderComponent,
    ModalComponent,

    HeaderComponent,
    SearchInputComponent,
    ButtonComponent,

    FillHeightDirective,
    ConfirmDeleteDirective,
    TimeAgoDirective
  ],
  providers: [
    LayoutService,
    ModalService
  ],
  entryComponents: [
    ModalComponent,
    ConfirmDeleteComponent
  ]
})
export class SharedModule {
}
