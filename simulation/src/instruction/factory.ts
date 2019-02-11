import {Logger} from 'mitosis';
import {IConfiguration, IInstruction, InstructionType, InstructionTypeMap} from './interface';

export class InstructionFactory {

  public static arrayFromJSON(instructions: Array<any> = []): Array<IInstruction> {
    const array: Array<IInstruction> = [];
    instructions.forEach(parameter => {
      const instruction = InstructionFactory.fromParameters(parameter);
      if (instruction) {
        array.push(instruction);
      }
    });
    return array;
  }

  public static fromParameters(parameters: any): IInstruction {
    if (!parameters.type) {
      Logger.getLogger('simulation')
        .error('could not parse instruction from', parameters);
      return null;
    }
    const instructionClass = InstructionTypeMap.get(parameters.type as InstructionType);
    const config = (parameters.configuration || {}) as IConfiguration;
    return new instructionClass(parameters.tick as number || 0, config);
  }
}
