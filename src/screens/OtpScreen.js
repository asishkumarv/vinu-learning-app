import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

export default function OtpScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState('');

  const verifyOtp = () => {
    if (otp.length === 6) {
      navigation.replace('Main');
    } else {
      alert('Please enter a valid 6 digit dummy OTP');
    }
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.jpeg')}
            style={styles.logo}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.heading, { color: colors.text }]}>OTP Verification</Text>
          <Text style={[styles.subText, { color: colors.textSecondary }]}>
            Enter the 6 digit code sent to your mobile number. (Dummy: any 6 digits)
          </Text>

          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="000000"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
          />

          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={verifyOtp}
          >
            <LinearGradient
              colors={['#0084FF', '#0055FF']}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Verify & Proceed</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resendContainer}>
            <Text style={{ color: colors.textSecondary }}>
              Didn't receive code? <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Resend</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 15,
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
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subText: {
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    borderRadius: 15,
    paddingVertical: 15,
    fontSize: 28,
    textAlign: 'center',
    letterSpacing: 10,
    marginBottom: 25,
    borderWidth: 1,
  },
  buttonContainer: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  button: {
    paddingVertical: 18,
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