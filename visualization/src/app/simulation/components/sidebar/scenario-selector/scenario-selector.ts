import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {HttpClient} from '@angular/common/http';

const scenarios: Array<string> = require('../../../../../scenarios/_index.json');

@Component({
  selector: 'app-scenario-selector',
  templateUrl: './scenario-selector.html',
  styleUrls: ['./scenario-selector.scss'],
})
export class ScenarioSelectorComponent implements OnInit, OnChanges {
  @Output()
  scenarioChange: EventEmitter<any>;

  public scenario: string;

  public scenarios: Array<{ label: string, value: string }>;

  private static saveScenario(scenario: string) {
    if (!scenario) {
      return;
    }
    return localStorage.setItem(`selected-scenario`, scenario);
  }

  private static getScenario() {
    return localStorage.getItem(`selected-scenario`);
  }

  constructor(private http: HttpClient) {
    this.scenarioChange = new EventEmitter();
    this.scenarios = [];
  }

  public selectScenario(scenario: string) {
    const existingScenario = this.scenarios
      .find(s => s.value === scenario);

    if (existingScenario) {
      this.scenario = existingScenario.value;
      this.http
        .get(`/scenarios/${scenario}`)
        .toPromise()
        .then((fileContent) => {
          this.scenarioChange.emit(fileContent);
          ScenarioSelectorComponent.saveScenario(this.scenario);
        })
        .catch(() => {
          if (this.scenarios.length > 0) {
            this.selectScenario(this.scenarios[0].value);
          }
        });
    } else if (this.scenarios.length > 0) {
      this.selectScenario(this.scenarios[0].value);
    }
  }

  ngOnInit(): void {
    scenarios.forEach(scenario => {
      this.scenarios.push({
        label: scenario.split('.')[0],
        value: scenario
      });
    });
    const selectedScenario = ScenarioSelectorComponent.getScenario();
    if (selectedScenario) {
      this.selectScenario(selectedScenario);
    } else {
      this.selectScenario(scenarios[0]);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
  }
}
