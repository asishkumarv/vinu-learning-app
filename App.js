import React from 'react';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/theme/ThemeContext';

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