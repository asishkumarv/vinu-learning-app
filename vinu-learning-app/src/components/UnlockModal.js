import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Animated, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function UnlockModal({ visible, onClose, onUnlock, videoTitle }) {
  const [isWatching, setIsWatching] = useState(false);
  const [progress] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      setIsWatching(false);
      progress.setValue(0);
    }
  }, [visible]);

  const startAd = () => {
    setIsWatching(true);
    Animated.timing(progress, {
      toValue: 1,
      duration: 3500, // 3.5 seconds dummy ad
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setTimeout(() => {
          setIsWatching(false);
          onUnlock();
        }, 500);
      }
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={40} color="#FFA000" />
          </View>

          <Text style={styles.title}>Locked Lesson</Text>
          <Text style={styles.subtitle}>
            "{videoTitle}" is locked. Watch a short ad to unlock it!
          </Text>

          {isWatching ? (
            <View style={styles.adContainer}>
              <Text style={styles.adText}>Watching ad... please wait</Text>
              <View style={styles.progressBarBg}>
                <Animated.View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%']
                      }) 
                    }
                  ]} 
                />
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.buttonContainer} onPress={startAd}>
              <LinearGradient
                colors={['#00A8FF', '#007AFF']}
                style={styles.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="play" size={20} color="#FFF" style={{ marginRight: 10 }} />
                <Text style={styles.buttonText}>Watch Ad to Unlock</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    width: '100%',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
  },
  button: {
    flexDirection: 'row',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  adContainer: {
    width: '100%',
    alignItems: 'center',
  },
  adText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00A8FF',
  },
});
