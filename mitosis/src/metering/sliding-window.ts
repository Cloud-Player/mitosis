export class SlidingWindow extends Set<number> {
  public static readonly WINDOW_SIZE = 4;
  private _sequence: number;

  slideAndAddSequence(sequence: number): void {
    this.slideSequence(sequence);
    this.add(sequence);
  }

  slideSequence(sequence: number) {
    if (this.isSequenceOutOfWindow(sequence)) {
      this._sequence = sequence;
    }
    this.removeOutDated();
  }

  removeOutDated(): void {
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

  isSequenceOutOfWindow(sequence: number): boolean {
    if (this._sequence == null) {
      return true;
    } else {
      return (sequence > this._sequence) || (sequence <= this._sequence - SlidingWindow.WINDOW_SIZE);
    }
  }
}
