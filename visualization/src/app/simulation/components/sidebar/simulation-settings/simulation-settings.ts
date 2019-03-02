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

  private getSmulationJson() {
    return Array.from(this.simulation.getNodeMap().values())
      .map(
        node => node.getMitosis().toJSON()
      );
  }

  public addNode() {
    this.simulation.createNode();
  }

  public download() {
    this.downloadTextAsFile(JSON.stringify(this.getSmulationJson()), 'snapshot.json');
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
  }
}
