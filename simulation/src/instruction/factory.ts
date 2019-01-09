import {IConfiguration, IInstruction, InstructionType, InstructionTypeMap} from './interface';

export class InstructionFactory {
  public static arrayFromJSON(scenario: { instructions: Array<any> }): Array<IInstruction> {
    const instructions: Array<IInstruction> = [];
    const parameters = scenario.instructions as Array<any>;
    parameters.forEach(parameter => {
      const instruction = InstructionFactory.fromParameters(parameter);
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
    const config = (parameters.configuration || {}) as IConfiguration;
    return new instructionClass(parameters.tick as number, config);
  }
}
