import React, { useRef, useEffect, useState } from "react";
import {MediaPlayer} from 'dashjs';

let init = false; // Can't use useState Hooks inside the callback from javascript function

export const Video = () => {
  const vRef = useRef(null);
  const [audioCtx] = useState(
    new (window.AudioContext || window.webkitAudioContext)()
  );
  const [channelGainNodes] = useState(
    Array(6)
      .fill()
      .map(_ => audioCtx.createGain())
  );
  const [toggleMap, setToggleMap] = useState(Array(6).fill(true));
  const [player] = useState(MediaPlayer().create())

  const onStreamInitialized = (e) => {
    if (!init) {
      // Init surround 5.1
      player.setCurrentTrack(player.getTracksFor('audio')[2]);
      init = true;
    }
  }

  useEffect(() => {
    const vid = vRef.current;
    const splitter = audioCtx.createChannelSplitter(6);
    const merger = audioCtx.createChannelMerger(6);

    if (vid && player) {
      player.initialize(vid, 'https://bitmovin-a.akamaihd.net/content/sintel/sintel.mpd', true)

      player.on(MediaPlayer.events.STREAM_INITIALIZED, onStreamInitialized, this);
 
      const source = audioCtx.createMediaElementSource(vid);
      source.connect(splitter);
      // Connect 6 splitter output to Channels Gain Node
      splitter.connect(channelGainNodes[0], 0);
      splitter.connect(channelGainNodes[1], 1);
      splitter.connect(channelGainNodes[2], 2);
      splitter.connect(channelGainNodes[3], 3);
      splitter.connect(channelGainNodes[4], 4);
      splitter.connect(channelGainNodes[5], 5);
      // Merge the 6 channels gain node back to single merger
      channelGainNodes[0].connect(merger, 0, 0);
      channelGainNodes[1].connect(merger, 0, 1);
      channelGainNodes[2].connect(merger, 0, 2);
      channelGainNodes[3].connect(merger, 0, 3);
      channelGainNodes[4].connect(merger, 0, 4);
      channelGainNodes[5].connect(merger, 0, 5);
      // Connecter merger to destination (speaker)
      merger.connect(audioCtx.destination);
    }
  }, []);

  const handleToggle = (i, value) => {
    const map = [...toggleMap];
    map[i] = value;
    channelGainNodes[i].gain.value = value ? 1 : 0;
    setToggleMap(map);
  };

  const switchTrack = (idx, value) => {
    if(value) {
      player.setCurrentTrack(player.getTracksFor('audio')[0]);
    } else {
      player.setCurrentTrack(player.getTracksFor('audio')[2]);
    }
  }

  return (
    <div>
      <video
        ref={vRef}
        height="360"
        controls
      />
      <Toggle label={'5.1'} isToggleLabel={'Stereo'} idx={0} onChange={switchTrack}/>
      {Array(6)
        .fill(0)
        .map((_, i) => (
          <Toggle key={i} label={`Channel ${i+1} OFF`} isToggleLabel={`Channel ${i+1} ON`} idx={i} onChange={handleToggle} />
        ))}
    </div>
  );
};

const Toggle = ({ isToggleLabel, label, idx, onChange }) => {
  const [isToggle, setIsToggle] = useState(true);

  const handleClick = () => {
    const value = !isToggle;
    setIsToggle(value);
    onChange(idx, value);
  };

  return (
    <button style={{ width: "9rem", display: "block" }} onClick={handleClick}>
      {isToggle ? `${isToggleLabel}` : `${label}`}
    </button>
  );
};

export default Video;
