import {Injectable, NgZone} from '@angular/core';
import {debounce, isString} from 'underscore';
import {Subject} from 'rxjs';

export enum LayoutChangeTypes {
  windowSizeChange
}

export interface ILayout {
  windowSize: {
    width: number;
    height: number;
  };
}

export interface ILayoutChange {
  changeType: LayoutChangeTypes;
  newLayout: ILayout;
}

@Injectable()
export class LayoutService {
  private _subject: Subject<ILayoutChange>;
  private _layoutProperties: ILayout;

  constructor(private zone: NgZone) {
    this._subject = new Subject<ILayoutChange>();
    this._layoutProperties = {
      windowSize: {
        width: 0,
        height: 0
      }
    };
    const throttledResizeListener = debounce(this.onWindowResize.bind(this), 100);
    this.zone.runOutsideAngular(() => {
      window.addEventListener('resize', throttledResizeListener);
    });
  }

  private onWindowResize() {
    this.emitLayoutChange(LayoutChangeTypes.windowSizeChange);
  }

  private setWindowSize() {
    this._layoutProperties.windowSize.width = window.innerWidth;
    this._layoutProperties.windowSize.height = window.innerHeight;
  }

  public getObservable(): Subject<ILayoutChange> {
    return this._subject;
  }

  public emitLayoutChange(layoutChangeType: LayoutChangeTypes): void {
    this.setWindowSize();
    this._subject.next({
      changeType: layoutChangeType,
      newLayout: this._layoutProperties
    });
  }

  public getLayoutProperties(): ILayout {
    return this._layoutProperties;
  }
}
