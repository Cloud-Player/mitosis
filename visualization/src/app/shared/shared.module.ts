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
import {
  MatAutocompleteModule,
  MatButtonModule,
  MatFormFieldModule,
  MatInputModule,
  MatSliderModule
} from '@angular/material';
import {ButtonComponent} from './components/ui/inputs/button/button';
import {CollapsibleComponent} from './components/collapsible/collapsible';
import {FormFieldComponent} from './components/ui/form/form-field/form-field';
import {SliderComponent} from './components/ui/inputs/slider/slider';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatSliderModule,
    MatFormFieldModule
  ],
  exports: [
    ScrollViewComponent,
    CollapsibleComponent,

    TabBarComponent,
    TabPaneComponent,

    ModalHolderComponent,
    ModalComponent,

    HeaderComponent,
    SearchInputComponent,
    ButtonComponent,
    SliderComponent,
    FormFieldComponent,

    FillHeightDirective,
    ConfirmDeleteDirective,
    TimeAgoDirective
  ],
  declarations: [
    ScrollViewComponent,
    ConfirmDeleteComponent,
    CollapsibleComponent,

    TabBarComponent,
    TabPaneComponent,

    ModalHolderComponent,
    ModalComponent,

    HeaderComponent,
    SearchInputComponent,
    ButtonComponent,
    SliderComponent,
    FormFieldComponent,

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
