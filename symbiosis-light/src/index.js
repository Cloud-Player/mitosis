import {Mitosis} from 'mitosis';

const videoEl = document.querySelector('video');
const recordEl = document.querySelector('button');

const mitosis = new Mitosis();

const onStreamAdded = (streamEv) => {
  if (streamEv.type === 'added') {
    videoEl.srcObject = streamEv.stream;
    videoEl.play();
  }
};

const startStream = () => {
  navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false
  }).then(
    (stream) => {
      mitosis.getStreamManager().setLocalStream(stream);
    });
};

mitosis
  .getStreamManager()
  .observeChannelChurn()
  .subscribe(
    channelEv => channelEv.value
      .observeStreamChurn()
      .subscribe(onStreamAdded)
  );

recordEl.addEventListener('click', startStream);
