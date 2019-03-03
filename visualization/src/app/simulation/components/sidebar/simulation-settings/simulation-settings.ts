import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Simulation} from 'mitosis-simulation';

@Component({
  selector: 'app-simulation-settings',
  templateUrl: './simulation-settings.html',
  styleUrls: ['./simulation-settings.scss'],
})
export class SimulationSettingsComponent implements OnInit, OnChanges {
  @Input()
  public simulation: Simulation;

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

  private getSimulationJson() {
    return Array.from(this.simulation.getNodeMap().values())
      .map(
        node => node.getMitosis().toJSON()
      );
  }

  public addNode() {
    this.simulation.addPeer();
  }

  public download() {
    const scenarioName = (localStorage.getItem(`selected-scenario`) || '').split('.')[0];
    this.downloadTextAsFile(
      JSON.stringify(this.getSimulationJson()), `snapshot-${scenarioName}-${this.simulation.getClock().getTick()}.json`);
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
  }
}
