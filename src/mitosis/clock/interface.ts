interface IClock {
  onTick(callback: () => void): void;
}
