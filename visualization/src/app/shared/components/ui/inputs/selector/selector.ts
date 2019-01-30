import {
  Component,
  EventEmitter, forwardRef,
  Input,
  Output
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

export interface ISelectorOption {
  value: any;
  label: string;
}

@Component({
  selector: 'app-selector',
  templateUrl: './selector.html',
  styleUrls: ['./selector.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectorComponent),
      multi: true
    }
  ]
})
export class SelectorComponent implements ControlValueAccessor {
  private _onChange: Function;
  private _onTouch: Function;

  @Input()
  public value: any;

  @Input()
  public required: boolean;

  @Input()
  public options: Array<ISelectorOption>;

  @Output()
  public valueChanged = new EventEmitter();

  private updateValue(value: number) {
    if (this._onChange) {
      this.value = value;
      this._onChange(this.value);
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

  writeValue(obj: any): void {
    this.updateValue(obj);
  }
}
