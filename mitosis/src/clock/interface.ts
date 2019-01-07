export interface IScheduledCallback {
  tick: number;
  cancelId: number;
  callback: () => void;
}

export interface IClock {

  fork(): IClock;

  start(): void;

  pause(): void;

  stop(): void;

  setInterval(callback: () => void): number;

  clearInterval(cancelId: number): void;

  setTimeout(callback: () => void, ticks: number): number;

  clearTimeout(cancelId: number): void;
}
