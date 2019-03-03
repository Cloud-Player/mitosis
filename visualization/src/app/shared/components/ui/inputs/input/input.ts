import {Component, EventEmitter, forwardRef, Input, Output} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

@Component({
  selector: 'app-input',
  styleUrls: ['./input.scss'],
  templateUrl: './input.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor {
  private _onChange: Function;
  private _onTouch: Function;
  public tmpValue: number;

  @Output()
  public valueChanged = new EventEmitter();

  @Input()
  public placeholder: string;

  constructor() {
  }

  public updateValue(value: number) {
    if (this._onChange) {
      this._onChange(value);
      this.valueChanged.emit(value);
    }
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
