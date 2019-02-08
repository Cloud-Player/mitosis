import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Subject} from 'rxjs/internal/Subject';
import {Subscription} from 'rxjs/internal/Subscription';
import {debounceTime, distinctUntilChanged, map, switchMap} from 'rxjs/operators';

@Component({
  selector: 'app-button',
  templateUrl: './button.html',
  styleUrls: ['./button.scss']
})
export class ButtonComponent {
  @Input()
  public type: string;

  @Input()
  public text: string;

  @Input()
  public color: string;

  @Input()
  disabled: boolean;
}
