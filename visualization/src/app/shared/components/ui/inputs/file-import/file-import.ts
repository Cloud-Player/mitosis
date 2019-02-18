import {Component, ElementRef, forwardRef, OnInit, ViewChild} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

@Component({
  selector: 'app-file-import',
  templateUrl: './file-import.html',
  styleUrls: ['./file-import.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FileImportComponent),
      multi: true
    }
  ]
})
export class FileImportComponent implements ControlValueAccessor, OnInit {
  private _onChange: Function;
  private _onTouch: Function;

  @ViewChild('fileSelector')
  public fileSelectorEl: ElementRef;

  private handleFileSelect(ev: any) {
    const files: FileList = ev.target.files;
    const file = files[0];
    const reader = new FileReader();

    // Closure to capture the file information.
    reader.onload = ((theFile) => {
      return (e) => {
        try {
          const json = JSON.parse(e.target.result);
          this.updateValue(json);
        } catch (err) {
          console.error(err);
        }
      };
    })(file);

    // Read in the image file as a data URL.
    reader.readAsText(file);
  }

  public triggerFileSelect() {
    this.fileSelectorEl.nativeElement.click();
  }

  public updateValue(value: number) {
    if (this._onChange) {
      this._onChange(value);
    }
  }

  ngOnInit(): void {
    this.fileSelectorEl.nativeElement
      .addEventListener('change', this.handleFileSelect.bind(this), false);
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
  }
}
