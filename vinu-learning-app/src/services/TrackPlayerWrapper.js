import { NativeModules } from 'react-native';

let TrackPlayer;
let Capability = {};
let Event = {};
const hasNativeModule = !!NativeModules.TrackPlayerModule;

if (hasNativeModule) {
  try {
    TrackPlayer = require('react-native-track-player').default;
    Capability = require('react-native-track-player').Capability;
    Event = require('react-native-track-player').Event;
  } catch (e) {
    console.warn('TrackPlayer require failed:', e);
  }
}

if (!TrackPlayer) {
  // Mock fallback interface for Expo Go & Web
  TrackPlayer = {
    setupPlayer: async () => {},
    updateOptions: async () => {},
    registerPlaybackService: () => {},
    add: async () => {},
    remove: async () => {},
    reset: async () => {},
    play: async () => {},
    pause: async () => {},
    stop: async () => {},
    seekTo: async () => {},
    getPosition: async () => 0,
    getPlaybackState: async () => ({ state: 'stopped' }),
    addEventListener: () => {
      return { remove: () => {} };
    },
  };

  Capability = {
    Play: 'play',
    Pause: 'pause',
    Stop: 'stop',
    SeekTo: 'seekTo',
  };

  Event = {
    PlaybackState: 'playback-state',
    RemotePlay: 'remote-play',
    RemotePause: 'remote-pause',
    RemoteStop: 'remote-stop',
  };
}

export default TrackPlayer;
export { Capability, Event, hasNativeModule };
