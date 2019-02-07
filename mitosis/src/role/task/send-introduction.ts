import {Logger} from '../../logger/logger';
import {Introduction} from '../../message/introduction';
import {Mitosis} from '../../mitosis';
import {RoleType} from '../interface';

export function sendIntroduction(mitosis: Mitosis): void {
  const introduction = new Introduction(
    mitosis.getMyAddress(),
    mitosis.getSignalAddress()
  );
  Logger.getLogger(mitosis.getMyAddress().getId()).debug('connecting to signal');
  mitosis.getPeerManager()
    .connectTo(mitosis.getSignalAddress())
    .then(
      signal => {
        signal.setRoles([RoleType.SIGNAL]);
        signal.send(introduction);
      }
    ).catch(
    error =>
      Logger.getLogger(mitosis.getMyAddress().getId()).warn('connecting to signal failed', error)
  );
}
