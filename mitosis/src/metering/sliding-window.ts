import {Configuration, Globals} from '../configuration';

export class SlidingWindow extends Set<number> {
  private _sequence = 0;

  private removeOutDated(): void {
    const iterable = this.values();
    let next = iterable.next();
    while (!next.done) {
      const sequence = next.value;
      if (this.isSequenceOutOfWindow(sequence)) {
        this.delete(sequence);
      }
      next = iterable.next();
    }
  }

  private nextSequence() {
    this._sequence = this._sequence + 1;
  }

  public isSequenceOutOfWindow(sequence: number): boolean {
    if (this._sequence == null) {
      return true;
    } else {
      return (sequence > this._sequence) || (sequence <= this._sequence - Globals.SLIDING_WINDOW_SIZE);
    }
  }

  public add(sequence: number): this {
    this.setSequence(sequence);
    super.add(sequence);
    return this;
  }

  public slide() {
    this.nextSequence();
    this.removeOutDated();
  }

  public setSequence(sequence: number) {
    if (this.isSequenceOutOfWindow(sequence)) {
      this._sequence = sequence;
    }
    this.removeOutDated();
  }

  public getSequenceNumber() {
    return this._sequence;
  }
}
