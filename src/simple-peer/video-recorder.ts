export class VideoRecorder {
  private _recorder: any;
  private _stream: any;
  private _isRecording: boolean;
  private _getRecorderPromise: Promise<any>;

  private initMediaRecorder() {
    return new Promise((resolve, reject) => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.enumerateDevices()
          .then((devices) => {
            let selectedDevice: any;
            devices.forEach((device) => {
              if (device.kind === 'videoinput' && !selectedDevice) {
                selectedDevice = device.deviceId;
              }
            });

            if (!selectedDevice) {
              reject('No camera was found!');
              return;
            }

            navigator.mediaDevices.getUserMedia(
              {
                audio: false,
                video: {
                  frameRate: 10.0,
                  width: 100
                }
              })
              .then((stream) => {
                this._recorder = new (window as any).MediaRecorder(stream, {
                  mimeType: 'video/webm;codecs=vp9',
                  audio: false
                });
                this._stream = stream;
                resolve(this._recorder);
              });

          });
      } else {
        reject('Not Supported');
      }
    });
  }

  private getRecorder(): Promise<any> {
    if (this._recorder) {
      Promise.resolve(this._recorder);
    } else {
      if (!this._getRecorderPromise) {
        this._getRecorderPromise = new Promise<any>((resolve) => {
          this.initMediaRecorder().then((recorder) => {
            resolve(recorder);
          });
        });
      }
      return this._getRecorderPromise;
    }
  }

  public stop() {
    this._isRecording = false;
    if (this._stream) {
      this._stream.getTracks().forEach((track: any) => {
        track.stop();
      });
    }
  }

  public start(): Promise<boolean> {
    return this.getRecorder().then(() => {
      this._isRecording = true;
      this._recorder.start(250);
      return true;
    }, (err) => {
      console.error(err);
      return false;
    });
  }

  public getStream(): Promise<any> {
    return this.getRecorder().then(() => {
      return this._stream;
    });
  }
}
