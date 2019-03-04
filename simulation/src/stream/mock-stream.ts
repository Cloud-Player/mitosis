import {uuid} from 'mitosis';
import {MockMediaStreamTrackEvent} from './interface';
import {MockMediaTrack} from './mock-track';

export class MockMediaStream extends EventTarget implements MediaStream {

  private _parent: MediaStream;
  private _tracks: Array<MediaStreamTrack>;

  public id: string;
  public onactive: ((this: MediaStream, ev: Event) => any) = () => null;
  public onaddtrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => any) = () => null ;
  public oninactive: ((this: MediaStream, ev: Event) => any) = () => null ;
  public onremovetrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => any) = () => null ;

  constructor(parent?: MediaStream) {
    super();
    this.id = uuid();
    this._tracks = [];
    this._parent = parent;
    if (parent) {
      parent
        .getTracks()
        .map(
          track => this.addTrack(track.clone())
        );
    } else {
      this.addTrack(new MockMediaTrack('video'));
    }
  }

  public get active(): boolean {
    return this._tracks
      .map(
        value => value.enabled
      )
      .includes(true);
  }

  public get ended(): boolean {
    return !this._tracks
      .map(
        value => value.readyState === 'live'
      )
      .includes(true);
  }

  public addTrack(track: MediaStreamTrack): void {
    this._tracks.push(track);
    const added = new MockMediaStreamTrackEvent('addtrack', track);
    this.onaddtrack(added);
    this.dispatchEvent(added);
    if (this._tracks.length === 1) {
      const active = new Event('active');
      this.onactive(active);
      this.dispatchEvent(active);
    }
    track.addEventListener('onended', () => {
      if (!this.active) {
        const inactive = new Event('inactive');
        this.oninactive(inactive);
        this.dispatchEvent(inactive);
      }
    });
  }

  public clone(): MediaStream {
    return new MockMediaStream(this);
  }

  public stop(): void {
    this._tracks.forEach(value => value.stop());
  }

  public getAudioTracks(): Array<MediaStreamTrack> {
    return this._tracks.filter(value => value.kind === 'audio');
  }

  public getTrackById(id: string): MediaStreamTrack {
    return this._tracks.find(value => value.id === id);
  }

  public getTracks(): Array<MediaStreamTrack> {
    return this._tracks;
  }

  public getVideoTracks(): Array<MediaStreamTrack> {
    return this._tracks.filter(value => value.kind === 'video');
  }

  public removeTrack(track: MediaStreamTrack): void {
    this._tracks = this._tracks.filter(value => value !== track);
    const removed = new MockMediaStreamTrackEvent('removetrack', track);
    this.onremovetrack(removed);
    this.dispatchEvent(removed);
    if (this._tracks.length === 0) {
      const inactive = new Event('inactive');
      this.oninactive(inactive);
      this.dispatchEvent(inactive);
    }
  }
}
