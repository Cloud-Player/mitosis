import {RoleType} from './type';

export interface IRole {
  readonly type: RoleType;

  onTick(): void;
}
