import {Component, Input, OnInit} from '@angular/core';
import {Mitosis} from 'mitosis';
import {StreamService} from '../../services/stream';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
})
export class SidebarComponent implements OnInit {

  @Input()
  public mitosis: Mitosis;

  constructor() {
  }

  ngOnInit(): void {
  }
}
