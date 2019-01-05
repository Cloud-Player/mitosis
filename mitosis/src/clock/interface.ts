export interface IScheduledCallback {
  tick: number;
  callback: () => void;
}

export interface IClock {

  fork(): IClock;

  start(): void;

  pause(): void;

  stop(): void;

  setInterval(callback: () => void): IScheduledCallback;

  clearInterval(scheduledCallback: IScheduledCallback): void;

  setTimeout(callback: () => void, ticks: number): IScheduledCallback;

  clearTimeout(scheduledCallback: IScheduledCallback): void;
}
