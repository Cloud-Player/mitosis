import {Simulation} from '../simulation';
import {IConfiguration} from './interface';

export abstract class AbstractInstruction {

  private readonly _tick: number;
  private readonly _configuration: IConfiguration;

  public constructor(tick: number, configuration: IConfiguration) {
    this._tick = tick;
    this._configuration = configuration;
  }

  public getTick(): number {
    return this._tick;
  }

  public getConfiguration(): IConfiguration {
    return this._configuration;
  }

  public abstract execute(simulation: Simulation): void;
}
