export interface IClock {
  onTick(callback: () => void): void;
}
