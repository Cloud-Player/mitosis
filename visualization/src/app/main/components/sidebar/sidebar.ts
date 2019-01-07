import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {Simulation} from 'mitosis-simulation';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
})
export class SidebarComponent implements OnInit {
  @Input()
  public selectedNode: Node;

  @Input()
  public simulation: Simulation;

  constructor() {
  }

  public search() {
  }

  public getClock() {
    return this.simulation.getClock();
  }

  ngOnInit(): void {
  }
}
