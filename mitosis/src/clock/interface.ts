export interface IClock {

  fork(): IClock;

  start(): void;

  pause(): void;

  stop(): void;

  setInterval(callback: () => void): void;

  clearInterval(callback: () => void): void;

  setTimeout(callback: () => void, ticks: number): void;

  clearTimeout(callback: () => void): void;
}
