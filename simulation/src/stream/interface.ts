export class MockMediaStreamTrackEvent extends Event implements MediaStreamTrackEvent {

  public track: MediaStreamTrack;

  constructor(type: string, track: MediaStreamTrack) {
    super(type);
    this.track = track;
  }
}
