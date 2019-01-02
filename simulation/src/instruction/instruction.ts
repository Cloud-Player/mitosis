import {IInstruction, InstructionType, InstructionTypeMap} from './interface';

export abstract class AbstractInstruction {

  private _tick: number;
  private _configuration: {};

  public constructor(tick: number, configuration: {}) {
    this._tick = tick;
    this._configuration = configuration;
  }

  public static arrayFromJSON(json: string): Array<IInstruction> {
    const instructions: Array<IInstruction> = [];
    const parameters = JSON.parse(json) as Array<any>;
    parameters.forEach(parameter => {
      const instruction = AbstractInstruction.fromParameters(parameter);
      if (instruction) {
        instructions.push(instruction);
      }
    });
    return instructions;
  }

  public static fromParameters(parameters: any): IInstruction {
    if (!parameters.type) {
      console.error('could not parse instruction from', parameters);
      return null;
    }
    const instructionClass = InstructionTypeMap.get(parameters.type as InstructionType);
    return new instructionClass();
  }

  public getTick(): number {
    return this._tick;
  }

  public getConfiguration(): {} {
    return this._configuration;
  }

  public abstract execute(): void;
}
