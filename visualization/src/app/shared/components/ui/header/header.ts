import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Subject} from 'rxjs/internal/Subject';
import {Subscription} from 'rxjs/internal/Subscription';
import {debounceTime, distinctUntilChanged, map, switchMap} from 'rxjs/operators';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class HeaderComponent {
  @Input()
  public title: string;

  @Input()
  public icon: string;
}
