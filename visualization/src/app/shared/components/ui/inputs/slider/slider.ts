import {Component, ElementRef, EventEmitter, forwardRef, Input, Output, Renderer2} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-slider',
  styleUrls: ['./slider.scss'],
  templateUrl: './slider.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SliderComponent),
      multi: true
    }
  ]
})
export class SliderComponent implements ControlValueAccessor {
  private _onChange: Function;
  private _onTouch: Function;
  private _subscriptions: Subscription;
  public tmpValue: number;
  @Input()
  public transformDisplayValue: Function;

  @Input()
  public showSliderValue: boolean;

  @Input()
  public value;

  @Input()
  public min = 0;

  @Input()
  public max = 100;

  @Input()
  public step = 1;

  @Input()
  public vertical = false;

  @Output()
  public valueChange = new EventEmitter();

  @Output()
  public valueChanged = new EventEmitter();

  constructor(private el: ElementRef, private renderer2: Renderer2) {
    this._subscriptions = new Subscription();
  }

  public updateValue(value: number) {
    if (this._onChange) {
      this._onChange(value);
      this.valueChanged.emit(value);
    }
    setTimeout(() => {
      if (document.activeElement) {
        (document.activeElement as HTMLInputElement).blur();
      }
    });
  }

  registerOnChange(fn: any): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this._onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
  }

  writeValue(val: number): void {
    this.tmpValue = val;
  }
}
