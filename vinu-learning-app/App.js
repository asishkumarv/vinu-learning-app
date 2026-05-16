import React from 'react';
import { LogBox } from 'react-native';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/theme/ThemeContext';

// Silence shadow and textShadow deprecation warnings from react-native-web
// These properties are still required for mobile, but react-native-web (SDK 54) 
// is transitioning to boxShadow and consolidated textShadow.
LogBox.ignoreLogs([
  'shadow* style props are deprecated',
  'textShadow* style props are deprecated',
]);

export default function App() {
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