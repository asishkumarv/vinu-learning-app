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

export default function LoginScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleLogin = async () => {
    if (!mobile) {
      Toast.show({ type: 'error', text1: 'Please enter your mobile number' });
      return;
    }

    setLoading(true);
    try {
      console.log('Login: Attempting login for', mobile);
      await authApi.login({ mobile });
      
      console.log('Login: Success sending OTP, navigating to OtpScreen...');
      Toast.show({ type: 'success', text1: 'OTP sent to WhatsApp' });
      navigation.navigate('Otp', { mobile });
    } catch (error) {
      console.error('Login Error:', error);
      let errorMsg = 'Something went wrong';
      if (error.response) {
        errorMsg = error.response.data?.error || `Server Error (${error.response.status})`;
      } else if (error.request) {
        errorMsg = 'No response from server. Check your internet.';
      } else {
        errorMsg = error.message;
      }
      Toast.show({ 
        type: 'error', 
        text1: 'Login Failed', 
        text2: errorMsg 
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

        <Text style={[styles.heading, { color: colors.text }]}>Welcome Back</Text>

        <View style={styles.form}>
          <TextInput
            placeholder="Mobile Number"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
            value={mobile}
            onChangeText={setMobile}
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
            onPress={handleLogin}
            disabled={!acceptedTerms || loading}
          >
            <LinearGradient
              colors={['#0084FF', '#0055FF']}
              style={styles.button}
            >
              <Text style={styles.buttonText}>{loading ? 'Sending OTP...' : 'Send OTP'}</Text>
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 25,
  },
  buttonContainer: {
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
    marginBottom: 25,
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