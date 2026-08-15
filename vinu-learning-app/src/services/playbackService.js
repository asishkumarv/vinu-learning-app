import AsyncStorage from '@react-native-async-storage/async-storage';
import TrackPlayer, { Event } from './TrackPlayerWrapper';

let isManualSkip = false;

export async function playbackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.reset());
  
  TrackPlayer.addEventListener(Event.RemoteNext, () => {
    isManualSkip = true;
    TrackPlayer.skipToNext().catch(() => {});
  });
  
  TrackPlayer.addEventListener(Event.RemotePrevious, () => {
    isManualSkip = true;
    TrackPlayer.skipToPrevious().catch(() => {});
  });
  
  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => TrackPlayer.seekTo(event.position));

  TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async (event) => {
    console.log('[playbackService] PlaybackActiveTrackChanged event:', event, 'isManualSkip:', isManualSkip);
    if (event.index === undefined || event.index === null) {
      return;
    }

    try {
      const isSettingUp = await AsyncStorage.getItem('isSettingUpBackground');
      if (isSettingUp === 'true') {
        console.log('[playbackService] Setup in progress, ignoring track change event.');
        return;
      }
      
      // If event.lastIndex is null or undefined, this is the initial track setup
      // (transferring from app foreground), not an auto-advance transition.
      if (event.lastIndex === null || event.lastIndex === undefined) {
        console.log('[playbackService] Initial track setup, skipping autoplay pause check.');
        return;
      }

      const stored = await AsyncStorage.getItem('autoPlay');
      const autoPlayEnabled = stored !== null ? JSON.parse(stored) : false;
      console.log('[playbackService] autoPlayEnabled:', autoPlayEnabled);
      if (!autoPlayEnabled) {
        if (isManualSkip) {
          isManualSkip = false;
        } else {
          console.log('[playbackService] Autoplay is OFF, pausing track player...');
          await TrackPlayer.pause();
        }
      } else {
        isManualSkip = false;
        console.log('[playbackService] Autoplay is ON, ensuring playback plays next track...');
        await TrackPlayer.play();
      }
    } catch (e) {
      console.warn('Error checking autoPlay in playbackService:', e);
    }
  });
}
