import {Component, OnInit, ViewEncapsulation} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './main.html',
  styleUrls: ['./main.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MainComponent implements OnInit {
  constructor() {
  }

  ngOnInit(): void {
  }
}
