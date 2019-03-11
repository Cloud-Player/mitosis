import {MasterClock} from 'mitosis';

export class MockClock extends MasterClock {

  public getPrecisionTimestamp(): number {
      return this.getTick();
  }
}
