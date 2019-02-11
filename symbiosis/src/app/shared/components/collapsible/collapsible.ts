import {
  AfterContentInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy, OnInit,
  Output,
  Renderer2,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {Subscription} from 'rxjs';
import {isUndefined} from 'underscore';

@Component({
  selector: 'app-collapsible',
  styleUrls: ['./collapsible.scss'],
  templateUrl: './collapsible.html'
})
export class CollapsibleComponent implements AfterContentInit, OnInit, OnDestroy {
  private _transitionDuration = 200;
  private _subscriptions: Subscription;
  private _isCollapsed = false;
  private getHeight: () => number;
  private removeMaxHeight: () => void;

  @ViewChild('collapsibleBody')
  private _collapsibleBody: ElementRef;

  @ViewChild('collapsibleBodyContent')
  private _collapsibleBodyContent: ElementRef;

  @Input()
  public id: string;

  @Input()
  public title: string;

  @Input()
  public text: string;

  @Input()
  public icon: string;

  @Input()
  public isCollapsed = false;

  @Output()
  public isCollapsedChange: EventEmitter<boolean>;

  constructor(private renderer: Renderer2) {
    this._subscriptions = new Subscription();
    this.isCollapsedChange = new EventEmitter();

    this.getHeight = () => {
      return this._collapsibleBodyContent.nativeElement.offsetHeight;
    };

    this.removeMaxHeight = () => {
      this._collapsibleBody.nativeElement.style.maxHeight = 'initial';
      this._collapsibleBody.nativeElement.style.overflow = 'initial';
      this._collapsibleBody.nativeElement.style.opacity = 1;
    };
  }

  private static saveToggleState(id: string, isOpen: boolean) {
    if (!id) {
      return;
    }
    return localStorage.setItem(`collabsible-${id}`, JSON.stringify(isOpen));
  }

  private static getToggleState(id: string) {
    if (!id) {
      return;
    }
    const state = localStorage.getItem(`collabsible-${id}`);
    if (!isUndefined(state)) {
      return JSON.parse(state);
    }
  }

  private collapsibleOnOpened() {
    this._subscriptions.unsubscribe();
    this.removeMaxHeight();
    this.isCollapsed = false;
    this.isCollapsedChange.emit(this.isCollapsed);
  }

  private collapsibleOnClosed() {
    this._subscriptions.unsubscribe();
    this._isCollapsed = true;
    this.isCollapsed = true;
    this.isCollapsedChange.emit(this.isCollapsed);
  }

  private collapse() {
    this._collapsibleBody.nativeElement.style.overflow = 'hidden';
    this._collapsibleBody.nativeElement.style.opacity = 0;
    this._collapsibleBody.nativeElement.style.maxHeight = '0px';
  }

  private open() {
    const calculatedBodyHeight = this.getHeight();

    this._subscriptions.unsubscribe();
    this._subscriptions = new Subscription();
    this._subscriptions.add(
      this.renderer.listen(this._collapsibleBody.nativeElement, 'transitionend', this.collapsibleOnOpened.bind(this))
    );

    if (calculatedBodyHeight > 0) {
      this._collapsibleBody.nativeElement.style.maxHeight = 0;
      this._collapsibleBody.nativeElement.style.opacity = 0;
      this._isCollapsed = false;

      setTimeout(() => {
        this._collapsibleBody.nativeElement.style.overflow = 'hidden';
        this._collapsibleBody.nativeElement.style.opacity = 1;
        this._collapsibleBody.nativeElement.style.maxHeight = `${calculatedBodyHeight}px`;
      }, 5);
    }
  }

  private close() {
    this._subscriptions.unsubscribe();
    this._subscriptions = new Subscription();
    this._subscriptions.add(
      this.renderer.listen(this._collapsibleBody.nativeElement, 'transitionend', this.collapsibleOnClosed.bind(this))
    );

    this._collapsibleBody.nativeElement.style.transition = `all ${this._transitionDuration / 1000}s ease`;
    this._collapsibleBody.nativeElement.style.maxHeight = `${this.getHeight()}px`;
    this._collapsibleBody.nativeElement.style.opacity = 1;

    setTimeout(() => {
      this.collapse();
    }, 5);
  }

  public isOpened() {
    return !this._isCollapsed;
  }

  public toggle() {
    if (this._isCollapsed) {
      this.open();
      CollapsibleComponent.saveToggleState(this.id, true);
    } else {
      this.close();
      CollapsibleComponent.saveToggleState(this.id, false);
    }
  }

  ngOnInit() {
    const persistedIsOpenState = CollapsibleComponent.getToggleState(this.id);
    if (!isUndefined(persistedIsOpenState)) {
      this.isCollapsed = !persistedIsOpenState;
    }
  }

  ngAfterContentInit(): void {
    if (this.isCollapsed) {
      this.collapse();
      this._isCollapsed = true;
      this.isCollapsed = true;
    } else {
      this.removeMaxHeight();
    }
    this._collapsibleBody.nativeElement.style.transition = `all ${this._transitionDuration / 1000}s ease`;
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }
}
