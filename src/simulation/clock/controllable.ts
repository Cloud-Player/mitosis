import {Clock} from '../../mitosis/clock/clock';

export class ControllableClock extends Clock {

  public start(): void {
    super.start();
  }

  public stop(): void {
    super.stop();
  }

  public getChild(): IClock {
    return new ControllableClock();
  }
}
