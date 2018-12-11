import {AddConnection} from './add-connection';
import {AddPeer} from './add-peer';
import {IInstruction} from './interface';
import {RemoveConnection} from './remove-connection';
import {RemovePeer} from './remove-peer';
import {InstructionType} from './type';

export abstract class Instruction implements IInstruction {

  private static readonly _mapping: {[key: string]: any} = {
    'add-peer': AddPeer,
    'remove-peer': RemovePeer,
    'add-connection': AddConnection,
    'remove-connection': RemoveConnection
  };
  private _tick: number;
  private _configuration: {};

  public static fromJSON(json: string): Array<IInstruction> {
    const instructions: Array<IInstruction> = [];
    const parameters = JSON.parse(json) as Array<any>;
    parameters.forEach(parameter => {
      const instruction = Instruction.fromParameters(parameter);
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
    const type: string = parameters.type as string;
    const subclass = Instruction._mapping[type];
    return new subclass();
  }

  protected constructor(tick: number, configuration: {}) {
    this._tick = tick;
    this._configuration = configuration;
  }

  public getTick(): number {
    return this._tick;
  }

  public getConfiguration(): {} {
    return this._configuration;
  }

  public getType(): InstructionType {
    const [key] = Object.entries(Instruction._mapping).find(([, v]) => this instanceof v);
    return key as InstructionType;
  }

  public abstract execute(): void;
}
