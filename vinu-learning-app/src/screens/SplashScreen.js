import React, { useEffect } from 'react';
import { View, Image, Text, StyleSheet, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashScreen({ navigation }) {
  const { colors } = useTheme();

  useEffect(() => {
    const init = async () => {
      console.log('SplashScreen: Initializing...');
      let token = null;
      try {
        token = await AsyncStorage.getItem('userToken');
        console.log('SplashScreen: Token found:', !!token);
      } catch (e) {
        console.error('SplashScreen: Error reading token', e);
      }

      // Always navigate after 2.5 seconds
      const timer = setTimeout(() => {
        if (token) {
          console.log('SplashScreen: Navigating to Main');
          navigation.replace('Main');
        } else {
          console.log('SplashScreen: Navigating to Login');
          navigation.replace('Login');
        }
      }, 2500);

      return () => clearTimeout(timer);
    };
    init();
  }, []);

  return (
    <LinearGradient
      colors={['#0084FF', '#0044CC']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.logoWrapper}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
        />
      </View>

      <Text style={styles.title}>VINU</Text>
      <Text style={styles.subtitle}>Smart Learning Platform</Text>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with ❤️ for Students</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 20,
  },
  title: {
    color: '#fff',
    fontSize: 42,
    fontWeight: 'bold',
    marginTop: 25,
    letterSpacing: 2,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
  },
  footerText: {
    color: '#FFFFFF',
    opacity: 0.7,
    fontSize: 14,
  },
});