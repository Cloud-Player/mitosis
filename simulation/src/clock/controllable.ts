import {Clock} from 'mitosis/src/clock/clock';

export class ControllableClock extends Clock {

  public start(): void {
    super.start();
  }

  public stop(): void {
    super.stop();
  }
}
