import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {Simulation} from 'mitosis-simulation';

@Component({
  selector: 'app-simulation',
  templateUrl: './simulation.html',
  styleUrls: ['./simulation.scss'],
})
export class SimulationComponent implements OnInit {
  constructor() {
  }

  ngOnInit(): void {
    const simulation = Simulation.getInstance();
  }
}
