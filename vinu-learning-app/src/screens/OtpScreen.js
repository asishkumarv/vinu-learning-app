import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

export default function OtpScreen({ navigation, route }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { mobile } = route.params || {};
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerifyOtp = async () => {
    if (otp.trim().length !== 6) {
      Toast.show({ type: 'error', text1: 'Please enter the 6-digit OTP' });
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.verifyOtp({ mobile, otp: otp.trim() });
      
      if (response.data.isNewUser) {
        Toast.show({ 
          type: 'success', 
          text1: 'OTP Verified', 
          text2: 'Please complete your profile to continue' 
        });
        navigation.replace('Register', { mobile });
      } else {
        await AsyncStorage.setItem('userToken', response.data.token);
        if (response.data.user) {
          await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        }
        Toast.show({ type: 'success', text1: 'Welcome back!', text2: 'Login successful' });
        navigation.replace('Main');
      }
    } catch (error) {
      console.error('OTP Verification Error:', error);
      let errorMsg = 'Invalid OTP code. Please check and try again.';
      if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      }
      Toast.show({ 
        type: 'error', 
        text1: 'Verification Failed', 
        text2: errorMsg 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;

    setResending(true);
    try {
      await authApi.resendOtp({ mobile });
      setCountdown(30);
      Toast.show({
        type: 'success',
        text1: 'OTP Resent',
        text2: 'New verification code dispatched to WhatsApp'
      });
    } catch (error) {
      console.error('Resend OTP Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Resend Failed',
        text2: error.response?.data?.error || 'Could not resend OTP. Please try again.'
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      {/* Top back navigation */}
      <View style={styles.headerBar}>
        <TouchableOpacity 
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/newlogo1.png')}
            style={styles.logo}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.heading, { color: colors.text }]}>Enter Verification Code</Text>
          <Text style={[styles.subText, { color: colors.textSecondary }]}>
            We've sent a 6-digit code to WhatsApp on{' '}
            <Text style={{ fontWeight: 'bold', color: colors.text }}>
              {mobile ? (mobile.length === 10 ? `+91 ${mobile}` : mobile) : ''}
            </Text>
          </Text>

          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="000000"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
            autoFocus={true}
          />

          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={handleVerifyOtp}
            disabled={loading}
          >
            <LinearGradient
              colors={['#0084FF', '#0055FF']}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify & Continue</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            {countdown > 0 ? (
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                Resend code in <Text style={{ color: '#0084FF', fontWeight: 'bold' }}>{countdown}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResendOtp} disabled={resending}>
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                  Didn't receive code?{' '}
                  <Text style={{ color: '#0084FF', fontWeight: 'bold' }}>
                    {resending ? 'Sending...' : 'Resend Code'}
                  </Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 18,
  },
  card: {
    width: '100%',
    borderRadius: 25,
    padding: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subText: {
    textAlign: 'center',
    marginBottom: 25,
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    borderRadius: 15,
    paddingVertical: 14,
    fontSize: 26,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 25,
    borderWidth: 1,
  },
  buttonContainer: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  button: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
});