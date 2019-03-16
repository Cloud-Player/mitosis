import {Component} from '@angular/core';
import {IModalComponent, IModalOptions} from '../../../shared/src/modal.interface';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.html',
  styleUrls: ['./welcome.scss']
})
export class WelcomeComponent implements IModalComponent {
  modalOptions: IModalOptions = {
    dismissible: false,
    title: this.getTitle(),
    secondaryAction: {
      text: 'Ok!'
    }
  };

  constructor() {
  }

  public setModal() {
  }

  public getTitle() {
    return 'Welcome!';
  }
}
