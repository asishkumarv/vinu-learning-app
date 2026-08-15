import React, { useEffect } from 'react';
import { LogBox, PermissionsAndroid, Platform } from 'react-native';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/theme/ThemeContext';
import TrackPlayer, { Capability, AppKilledPlaybackBehavior } from './src/services/TrackPlayerWrapper';
import { playbackService } from './src/services/playbackService';

// Silence shadow and textShadow deprecation warnings from react-native-web
// These properties are still required for mobile, but react-native-web (SDK 54) 
// is transitioning to boxShadow and consolidated textShadow.
LogBox.ignoreLogs([
  'shadow* style props are deprecated',
  'textShadow* style props are deprecated',
]);

import { Audio } from 'expo-av';

TrackPlayer.registerPlaybackService(() => playbackService);

export default function App() {
  useEffect(() => {
    async function requestNotificationPermission() {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Notification permission granted');
          } else {
            console.log('Notification permission denied');
          }
        } catch (err) {
          console.warn('Notification permission request error:', err);
        }
      }
    }

    async function setupPlayer() {
      await requestNotificationPermission();

      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.warn('Audio mode setup error:', e);
      }

      try {
        await TrackPlayer.setupPlayer({
          handleAudioBecomingNoisy: true,
          android: {
            wakeMode: 'network',
          },
        });
        await TrackPlayer.updateOptions({
          android: {
            appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
          },
          icon: require('./assets/newlogo1_square.png'),
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.SeekTo,
          ],
          compactCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
          ],
          notificationCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.SeekTo,
          ],
        });
      } catch (e) {
        // Player already setup
      }
    }
    setupPlayer();
  }, []);

  return (
    <ThemeProvider>
      <NavigationIndependentTree>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </NavigationIndependentTree>
    </ThemeProvider>
  );
}