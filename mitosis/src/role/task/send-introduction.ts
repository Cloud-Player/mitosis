import {Introduction} from '../../message/introduction';
import {Mitosis, RoleType} from '../../mitosis';

export function sendIntroduction(mitosis: Mitosis): void {
  const introduction = new Introduction(
    mitosis.getMyAddress(),
    mitosis.getSignalAddress()
  );
  mitosis.getPeerManager()
    .connectTo(mitosis.getSignalAddress())
    .then(
      signal => {
        signal.setRoles([RoleType.SIGNAL]);
        signal.send(introduction);
      }
    );
}
