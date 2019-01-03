import {Clock} from 'mitosis';

export class ControllableClock extends Clock {

  public start(): void {
    super.start();
  }

  public stop(): void {
    super.stop();
  }
}
