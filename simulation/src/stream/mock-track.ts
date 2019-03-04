import {uuid} from 'mitosis';

export class MockMediaTrack extends EventTarget implements MediaStreamTrack {

  private _parent: MediaStreamTrack;
  private _enabled = true;

  public id: string;
  public kind: string;
  public isolated = false;
  public label: string;
  public muted = false;
  public readonly = true;
  private _readyState: MediaStreamTrackState = 'live';
  public onended: ((this: MediaStreamTrack, ev: Event) => any) = () => null;
  public onisolationchange: ((this: MediaStreamTrack, ev: Event) => any) = () => null;
  public onmute: ((this: MediaStreamTrack, ev: Event) => any)  = () => null;
  public onoverconstrained: ((this: MediaStreamTrack, ev: Event) => any)  = () => null;
  public onunmute: ((this: MediaStreamTrack, ev: Event) => any)  = () => null;

  public constructor(kind: string, parent?: MediaStreamTrack) {
    super();
    this.id = uuid();
    this.kind = kind;
    this._parent = parent;
  }

  public get remote(): boolean {
    return !!this._parent;
  }

  public get enabled(): boolean {
    if (this._enabled && this._parent) {
      return this._parent.enabled;
    }
    return this._enabled;
  }

  public set enabled(value: boolean) {
    this._enabled = value;
  }

  public get readyState(): MediaStreamTrackState {
    if (this._readyState === 'live' && this._parent) {
      return this._parent.readyState;
    }
    return this._readyState;
  }

  public set readyState(value: MediaStreamTrackState) {
    this._readyState = value;
  }

  public applyConstraints(constraints: MediaTrackConstraints): Promise<void> {
    return Promise.resolve();
  }

  public clone(): MediaStreamTrack {
    return new MockMediaTrack(this.kind, this);
  }

  public getCapabilities(): MediaTrackCapabilities {
    return {};
  }

  public getConstraints(): MediaTrackConstraints {
    return {};
  }

  public getSettings(): MediaTrackSettings {
    return {};
  }

  public stop(): void {
    this._enabled = false;
    this._readyState = 'ended';
    const ended = new Event('ended');
    this.onended(ended);
    this.dispatchEvent(ended);
  }
}
