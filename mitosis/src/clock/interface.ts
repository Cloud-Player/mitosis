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

  tick(): void;

  setSpeed(speed: number): void;

  setInterval(callback: () => void, interval?: number): number;

  clearInterval(cancelId: number): void;

  setTimeout(callback: () => void, timeout?: number): number;

  clearTimeout(cancelId: number): void;

  isRunning(): boolean;

  getTick(): number;

  forward(tick: number): void;

  rewind(): void;

  timeIt(): () => number;
}
