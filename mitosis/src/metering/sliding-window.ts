export class SlidingWindow extends Set<number> {
  public static readonly WINDOW_SIZE = 12;
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

  private isSequenceOutOfWindow(sequence: number): boolean {
    if (this._sequence == null) {
      return true;
    } else {
      return (sequence > this._sequence) || (sequence <= this._sequence - SlidingWindow.WINDOW_SIZE);
    }
  }

  private nextSequence() {
    this._sequence = this._sequence + 1;
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
