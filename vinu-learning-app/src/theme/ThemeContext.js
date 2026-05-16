import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const theme = {
    isDarkMode,
    colors: isDarkMode ? darkColors : lightColors,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

const lightColors = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  primary: '#0084FF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  chip: '#F3F4F6',
  chipActive: '#0084FF',
  chipText: '#4B5563',
  chipTextActive: '#FFFFFF',
};

const darkColors = {
  background: '#000000',
  surface: '#111827',
  primary: '#0ea5ff',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  border: '#374151',
  chip: '#1F2937',
  chipActive: '#0ea5ff',
  chipText: '#9CA3AF',
  chipTextActive: '#FFFFFF',
};

export const useTheme = () => useContext(ThemeContext);
