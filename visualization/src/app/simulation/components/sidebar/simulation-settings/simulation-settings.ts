import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Simulation} from 'mitosis-simulation';
import {D3DirectedGraphComponent} from '../../../../shared/components/d3-directed-graph/d3-directed-graph';

@Component({
  selector: 'app-simulation-settings',
  templateUrl: './simulation-settings.html',
  styleUrls: ['./simulation-settings.scss'],
})
export class SimulationSettingsComponent implements OnInit, OnChanges {
  @Input()
  public simulation: Simulation;

  @Input()
  public graph: D3DirectedGraphComponent;

  constructor() {
  }

  private downloadTextAsFile(fileContent: string, fileName: string) {
    const pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(fileContent));
    pom.setAttribute('download', fileName);

    if (document.createEvent) {
      const event = document.createEvent('MouseEvents');
      event.initEvent('click', true, true);
      pom.dispatchEvent(event);
    } else {
      pom.click();
    }
  }

  private getSmulationJson() {
    return this.graph.model.getNodes().map(
      node => node.toJSON()
    );
  }

  public addNode() {
    this.simulation.createNode();
  }

  public download() {
    const scenarioName = (localStorage.getItem(`selected-scenario`) || '').split('.')[0];
    this.downloadTextAsFile(
      JSON.stringify(this.getSmulationJson()), `snapshot-${scenarioName}-${this.simulation.getClock().getTick()}.json`);
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
  }
}
