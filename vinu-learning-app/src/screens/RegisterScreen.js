import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authApi } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

export default function RegisterScreen({ navigation, route }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { mobile } = route?.params || {};
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleRegister = async () => {
    if (!fullName) {
      Toast.show({ type: 'error', text1: 'Please enter your name' });
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.register({ 
        name: fullName, 
        mobile: mobile
      });
      await AsyncStorage.setItem('userToken', response.data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
      Toast.show({ type: 'success', text1: 'Profile Created successfully' });
      navigation.replace('Main');
    } catch (error) {
      Toast.show({ 
        type: 'error', 
        text1: 'Registration Failed', 
        text2: error.response?.data?.error || 'Something went wrong' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/newlogo1.png')}
            style={styles.logo}
          />
        </View>

        <Text style={[styles.heading, { color: colors.text }]}>Complete Profile</Text>

        <View style={styles.form}>
          <TextInput
            placeholder="Full Name"
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
            value={fullName}
            onChangeText={setFullName}
          />

          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              style={styles.checkboxTouch}
              activeOpacity={0.7}
            >
              <Ionicons
                name={acceptedTerms ? 'checkbox' : 'square-outline'}
                size={22}
                color={acceptedTerms ? '#0084FF' : colors.textSecondary}
              />
            </TouchableOpacity>
            <Text style={[styles.checkboxLabel, { color: colors.textSecondary }]}>
              I agree to the{' '}
              <Text
                style={[styles.linkText, { color: '#0084FF' }]}
                onPress={() => navigation.navigate('PrivacyPolicy')}
              >
                Privacy & Policy and Terms of Use
              </Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.buttonContainer, { opacity: acceptedTerms && !loading ? 1 : 0.5 }]}
            onPress={handleRegister}
            disabled={!acceptedTerms || loading}
          >
            <LinearGradient
              colors={['#0084FF', '#0055FF']}
              style={styles.button}
            >
              <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Complete Profile'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 25,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  input: {
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    fontSize: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  buttonContainer: {
    marginTop: 10,
    borderRadius: 15,
    overflow: 'hidden',
  },
  button: {
    padding: 18,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  checkboxTouch: {
    marginRight: 10,
  },
  checkboxLabel: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  linkText: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});