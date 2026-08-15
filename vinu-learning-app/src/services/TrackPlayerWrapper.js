import { NativeModules } from 'react-native';

let TrackPlayer;
let Capability = {};
let Event = {};
let AppKilledPlaybackBehavior = {};
const hasNativeModule = !!NativeModules.TrackPlayerModule;

if (hasNativeModule) {
  try {
    const rntp = require('react-native-track-player');
    TrackPlayer = rntp.default || rntp;
    Capability = rntp.Capability || {};
    Event = rntp.Event || {};
    AppKilledPlaybackBehavior = rntp.AppKilledPlaybackBehavior || {};
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
    getActiveTrackIndex: async () => 0,
    getActiveTrack: async () => null,
    getPlaybackState: async () => ({ state: 'stopped' }),
    addEventListener: () => ({ remove: () => {} }),
  };

  Capability = {
    Play: 'play',
    Pause: 'pause',
    Stop: 'stop',
    SeekTo: 'seekTo',
    SkipToNext: 'skipToNext',
    SkipToPrevious: 'skipToPrevious',
    JumpForward: 'jumpForward',
    JumpBackward: 'jumpBackward',
  };

  Event = {
    PlaybackState: 'playback-state',
    PlaybackTrackChanged: 'playback-track-changed',
    PlaybackQueueEnded: 'playback-queue-ended',
    RemotePlay: 'remote-play',
    RemotePause: 'remote-pause',
    RemoteStop: 'remote-stop',
    RemoteNext: 'remote-next',
    RemotePrevious: 'remote-previous',
    RemoteSeek: 'remote-seek',
  };

  AppKilledPlaybackBehavior = {
    ContinuePlayback: 'continue-playback',
    PausePlayback: 'pause-playback',
    StopPlaybackAndRemoveNotification: 'stop-playback-and-remove-notification',
  };
}

export default TrackPlayer;
export { Capability, Event, AppKilledPlaybackBehavior, hasNativeModule };
