import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/theme/ThemeContext';
import TrackPlayer, { Capability } from './src/services/TrackPlayerWrapper';
import { playbackService } from './src/services/playbackService';

// Silence shadow and textShadow deprecation warnings from react-native-web
// These properties are still required for mobile, but react-native-web (SDK 54) 
// is transitioning to boxShadow and consolidated textShadow.
LogBox.ignoreLogs([
  'shadow* style props are deprecated',
  'textShadow* style props are deprecated',
]);

TrackPlayer.registerPlaybackService(() => playbackService);

export default function App() {
  useEffect(() => {
    async function setupPlayer() {
      try {
        await TrackPlayer.setupPlayer();
        await TrackPlayer.updateOptions({
          capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.Stop,
            Capability.SeekTo,
          ],
          compactCapabilities: [
            Capability.Play,
            Capability.Pause,
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