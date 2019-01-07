import {AfterContentInit, Directive, ElementRef, Input, OnDestroy, Optional} from '@angular/core';
import {LayoutChangeTypes, LayoutService} from '../services/layout';
import {Subscription} from 'rxjs';
import {filter} from 'rxjs/internal/operators';

@Directive({
  selector: '[appFillHeight]'
})
export class FillHeightDirective implements AfterContentInit, OnDestroy {
  private _padding = 0;
  private _subscription: Subscription;

  private _boundingClientRec: ClientRect;

  @Input()
  minHeight = true;

  constructor(private el: ElementRef,
              private layoutService: LayoutService) {
    this._subscription = new Subscription();
  }

  private setHeight() {
    const offsetTop = this._boundingClientRec.top;
    const screenHeight = '100vh';

    const height = `calc(${screenHeight} - ${offsetTop - this._padding}px)`;
    if (this.minHeight) {
      this.el.nativeElement.style.minHeight = height;
    } else {
      this.el.nativeElement.style.height = height;
    }
  }

  ngAfterContentInit(): void {
    this._padding += parseInt(this.el.nativeElement.style.paddingTop, 10) || 0;
    this._padding += parseInt(this.el.nativeElement.style.paddingBottom, 10) || 0;
    this._boundingClientRec = this.el.nativeElement.getBoundingClientRect();
    this.setHeight();
    this._subscription.add(
      this.layoutService.getObservable()
        .pipe(
          filter((ev) => {
            return ev.changeType === LayoutChangeTypes.windowSizeChange;
          })
        )
        .subscribe(this.setHeight.bind(this))
    );
    this.setHeight();
  }

  ngOnDestroy() {
    this._subscription.unsubscribe();
  }
}
