import React, { useState, useRef, useEffect, memo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  Platform,
  Pressable,
  useWindowDimensions,
  StatusBar,
  LogBox,
  ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { contentApi, progressApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UnlockModal from '../components/UnlockModal';

LogBox.ignoreLogs(['[expo-av]: Video component from `expo-av` is deprecated']);

const VideoItem = ({ item, index, totalCount, isActive, isFocused, videoHeight, videoWidth, isCompleted, onToggleComplete, isUnlocked, onOpenUnlockModal, autoPlay, onAutoNext }) => {
  const safeAreaInsets = useSafeAreaInsets();
  const videoRef = useRef(null);
  
  const isFree = item.is_free;
  const isLocked = !isFree && !isUnlocked;
  const [status, setStatus] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [showSeekFeedback, setShowSeekFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastTap = useRef(null);

  useEffect(() => {
    const handlePlayPause = async () => {
      try {
        if (isActive && isFocused && !isLocked) {
          await videoRef.current?.playAsync();
        } else {
          await videoRef.current?.pauseAsync();
        }
      } catch (e) {
        // Silently catch play/pause interruptions
      }
    };
    handlePlayPause();
  }, [isActive, isFocused, isLocked]);

  const onPlaybackStatusUpdate = (newStatus) => {
    setStatus(newStatus);
    if (newStatus.didJustFinish) {
      console.log('Video finished:', item.title);
      onToggleComplete(item.id, 'completed');
      if (autoPlay) {
        console.log('Auto-playing next...');
        const nextIndex = index + 1;
        if (nextIndex < totalCount) {
          onAutoNext?.(nextIndex);
        }
      }
    }
    if (newStatus.isBuffering || !newStatus.isLoaded) {
      if (!isLoading) setIsLoading(true);
    } else {
      if (isLoading) setIsLoading(false);
    }
  };

  const handleVideoTap = (event) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    const touchX = event.nativeEvent?.pageX || event.nativeEvent?.locationX || 0;

    if (touchX > 0 && lastTap.current && (now - lastTap.current) < DOUBLE_TAP_DELAY) {
      if (touchX < videoWidth / 2) {
        seek(-10000, 'left');
      } else {
        seek(10000, 'right');
      }
    } else {
      togglePlayback();
    }
    lastTap.current = now;
  };

  const togglePlayback = () => {
    if (status.isPlaying) {
      videoRef.current?.pauseAsync();
    } else {
      videoRef.current?.playAsync();
    }
  };

  const seek = async (amount, direction) => {
    if (status.positionMillis !== undefined && status.durationMillis) {
      const newPos = Math.max(0, Math.min(status.durationMillis, status.positionMillis + amount));
      if (isFinite(newPos)) {
        await videoRef.current?.setPositionAsync(newPos);
        if (direction) {
          setShowSeekFeedback(direction);
          setTimeout(() => setShowSeekFeedback(null), 600);
        }
      }
    }
  };

  const handleTimelinePress = (event) => {
    const touchX = event.nativeEvent.locationX;
    const timelineWidth = videoWidth - 120;
    if (status.durationMillis && timelineWidth > 0) {
      const percentage = touchX / timelineWidth;
      const newPosition = percentage * status.durationMillis;
      if (isFinite(newPosition)) {
        videoRef.current?.setPositionAsync(Math.max(0, Math.min(status.durationMillis, newPosition)));
      }
    }
  };

  const formatTime = (millis) => {
    if (!millis || isNaN(millis)) return '00:00';
    const totalSeconds = millis / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = (status.positionMillis / status.durationMillis) * 100 || 0;
  const controlsBottom = 110;

  return (
    <View style={[styles.videoContainer, { height: videoHeight, width: videoWidth }]}>
      <Pressable onPress={handleVideoTap} style={styles.videoWrapper}>
        <Video
          key={item.video_url || item.id}
          ref={videoRef}
          source={{ uri: item.video_url ? item.video_url : contentApi.getVideoUrl(item.id) }}
          style={[styles.video, isLocked && { opacity: 0.3 }]}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={isActive && isFocused && !isLocked}
          isLooping={false}
          useNativeControls={false}
          isMuted={isMuted}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          onLoadStart={() => !isLocked && setIsLoading(true)}
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
        />
        
        {isLocked && (
          <View style={styles.lockedPlayerOverlay}>
            <View style={styles.lockCircle}>
              <Ionicons name="lock-closed" size={50} color="#FFF" />
            </View>
            <Text style={styles.lockedText}>This lesson is locked</Text>
            <TouchableOpacity style={styles.unlockButton} onPress={() => onOpenUnlockModal(item)}>
              <LinearGradient
                colors={['#00A8FF', '#007AFF']}
                style={styles.unlockGradient}
              >
                <Text style={styles.unlockBtnText}>Watch Ad to Unlock</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
        
        {showSeekFeedback && (
          <View style={[styles.seekFeedback, showSeekFeedback === 'left' ? { left: 40 } : { right: 40 }]}>
            <View style={styles.seekCircle}>
              <Ionicons name={showSeekFeedback === 'left' ? "play-back" : "play-forward"} size={30} color="#FFF" />
            </View>
            <Text style={styles.seekText}>10s</Text>
          </View>
        )}

        {!status.isPlaying && isActive && !showSeekFeedback && !isLoading && (
          <View style={styles.playOverlay}>
            <Ionicons name="play" size={70} color="rgba(255,255,255,0.6)" />
          </View>
        )}
      </Pressable>
      
      {/* HUD AND CONTROLS */}
      {(!status.isPlaying || !isActive) && !isLoading && (
        <View style={styles.hudContainer} pointerEvents="box-none">
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent']}
            style={styles.topGradient}
            pointerEvents="none"
          />
          
          <View style={styles.topOverlay} pointerEvents="box-none">
            <View style={styles.detailsContainer}>
              <Text style={styles.titleText}>{item.title}</Text>
              <Text style={styles.authorText}>By {item.author || 'Dr. Vinu'}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.completeButton, { backgroundColor: isCompleted ? '#4CAF50' : 'rgba(0,0,0,0.5)' }]}
              onPress={() => onToggleComplete(item.id, isCompleted ? 'started' : 'completed')}
            >
              <Ionicons name={isCompleted ? 'checkmark-circle' : 'checkmark-circle-outline'} size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.bottomGradient}
            pointerEvents="none"
          />

          <View style={[styles.controlBar, { bottom: controlsBottom + (safeAreaInsets?.bottom || 0) }]} pointerEvents="box-none">
            <View style={styles.timerRow}>
              <Text style={styles.timeLabel}>{formatTime(status.positionMillis)}</Text>
              <Pressable onPress={handleTimelinePress} style={styles.progressBarContainer}>
                <View style={styles.progressTrack} />
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
              </Pressable>
              <Text style={styles.timeLabel}>{formatTime(status.durationMillis)}</Text>
            </View>

            <View style={styles.buttonRow} pointerEvents="box-none">
              <TouchableOpacity onPress={() => setIsMuted(!isMuted)} style={styles.iconBtn}>
                <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={22} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => seek(-10000, 'left')} style={styles.iconBtn}>
                <Ionicons name="play-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={togglePlayback} style={styles.mainPlayBtn}>
                <Ionicons name={status.isPlaying ? "pause" : "play"} size={30} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => seek(10000, 'right')} style={styles.iconBtn}>
                <Ionicons name="play-forward" size={24} color="#FFF" />
              </TouchableOpacity>
              <View style={{ width: 44 }} /> 
            </View>
          </View>
        </View>
      )}

      {/* GLOBAL LOADING OVERLAY FOR THIS ITEM - ALWAYS ON TOP */}
      {isLoading && (
        <View style={styles.bufferingOverlay} pointerEvents="none">
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#0084FF" />
            <Text style={styles.loaderText}>Buffering...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default function ReelsScreen({ route, navigation }) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const bottomTabHeight = 85;

  const videoHeight = (windowHeight - bottomTabHeight - insets.top);
  const videoWidth = windowWidth;

  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [completedVideos, setCompletedVideos] = useState({});
  const [videoData, setVideoData] = useState([]);
  const [unlockedVideos, setUnlockedVideos] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVideoToUnlock, setSelectedVideoToUnlock] = useState(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchVideos();
    fetchUserProgress();
    loadUnlockedVideos();
    loadSettings();
  }, [route.params?.videoId]);

  useFocusEffect(
    React.useCallback(() => {
      loadSettings();
      return () => {};
    }, [])
  );

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem('autoPlay');
      if (stored !== null) setAutoPlay(JSON.parse(stored));
    } catch (e) { console.error(e); }
  };

  const loadUnlockedVideos = async () => {
    try {
      const stored = await AsyncStorage.getItem('unlockedVideos');
      if (stored) setUnlockedVideos(JSON.parse(stored));
    } catch (e) { console.error(e); }
  };

  const handleUnlockSuccess = async () => {
    if (!selectedVideoToUnlock) return;
    const newUnlocked = { ...unlockedVideos, [selectedVideoToUnlock.id]: true };
    setUnlockedVideos(newUnlocked);
    await AsyncStorage.setItem('unlockedVideos', JSON.stringify(newUnlocked));
    setModalVisible(false);
  };

  const openUnlockModal = (video) => {
    setSelectedVideoToUnlock(video);
    setModalVisible(true);
  };

  const fetchVideos = async () => {
    try {
      const response = await contentApi.getRecentReleases();
      setVideoData(response.data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  useEffect(() => {
    if (route.params?.videoId && videoData.length > 0) {
      const index = videoData.findIndex(v => Number(v.id) === Number(route.params.videoId));
      if (index !== -1) {
        setActiveVideoIndex(index);
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index, animated: false });
        }, 500);
      }
    }
  }, [route.params?.videoId, videoData]);

  const fetchUserProgress = async () => {
    try {
      const response = await progressApi.getUserProgress();
      const progressMap = {};
      response.data.forEach(p => {
        if (p.status === 'completed') {
          progressMap[p.episode_id] = true;
        }
      });
      setCompletedVideos(progressMap);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const toggleComplete = async (id, newStatus) => {
    const isNowCompleted = newStatus === 'completed';
    setCompletedVideos(prev => ({ ...prev, [id]: isNowCompleted }));
    try {
      await progressApi.updateProgress({ episode_id: id, status: newStatus });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveVideoIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 30 }).current;

  const initialIndex = route.params?.videoId && videoData.length > 0 
    ? videoData.findIndex(v => Number(v.id) === Number(route.params.videoId)) 
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: '#000', paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {videoData.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="videocam-outline" size={80} color="rgba(255,255,255,0.2)" />
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, marginTop: 20 }}>More reels coming soon...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={videoData}
          renderItem={({ item, index }) => (
            <VideoItem 
              item={item}
              index={index}
              totalCount={videoData.length}
              isActive={activeVideoIndex === index}
              isFocused={isFocused}
              videoHeight={videoHeight}
              videoWidth={videoWidth}
              isCompleted={completedVideos[item.id]}
              onToggleComplete={toggleComplete}
              isUnlocked={unlockedVideos[item.id]}
              onOpenUnlockModal={openUnlockModal}
              autoPlay={autoPlay}
              onAutoNext={(nextIndex) => {
                setActiveVideoIndex(nextIndex);
                setTimeout(() => {
                  flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
                }, 100);
              }}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          pagingEnabled={true}
          initialScrollIndex={initialIndex !== -1 ? initialIndex : 0}
          getItemLayout={(data, index) => ({
            length: videoHeight,
            offset: videoHeight * index,
            index,
          })}
          disableIntervalMomentum={true}
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          removeClippedSubviews={Platform.OS !== 'web'}
          maxToRenderPerBatch={2}
          windowSize={3}
        />
      )}

      <UnlockModal 
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onUnlock={handleUnlockSuccess}
        videoTitle={selectedVideoToUnlock?.title}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  videoContainer: { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  videoWrapper: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  video: { width: '100%', height: '100%' },
  hudContainer: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  playOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 5 },
  seekFeedback: { position: 'absolute', top: '40%', alignItems: 'center', zIndex: 20 },
  seekCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  seekText: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginTop: 8 },
  topOverlay: { position: 'absolute', top: 20, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  detailsContainer: { flex: 1 },
  titleText: { color: '#FFF', fontSize: 18, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 10 },
  authorText: { color: '#CCC', fontSize: 13, marginTop: 4, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 5 },
  completeButton: { padding: 8, borderRadius: 20 },
  controlBar: { position: 'absolute', bottom: 50, left: 0, right: 0, paddingHorizontal: 20 },
  timerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  timeLabel: { color: '#FFF', fontSize: 11, width: 40, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 5 },
  progressBarContainer: { flex: 1, height: 20, marginHorizontal: 5, justifyContent: 'center' },
  progressTrack: { width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 },
  progressBar: { position: 'absolute', left: 0, height: 4, backgroundColor: '#0084FF', borderRadius: 2, zIndex: 1 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconBtn: { padding: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.8, shadowRadius: 2 },
  mainPlayBtn: { backgroundColor: 'rgba(255,255,255,0.1)', width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 5 },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 120 },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 180 },
  bufferingOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    zIndex: 100,
    elevation: 10,
  },
  loaderBox: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  loaderText: {
    color: '#0084FF',
    marginTop: 12,
    fontWeight: 'bold',
    fontSize: 16,
  },
  lockedPlayerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  lockCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  lockedText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 30,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  unlockButton: {
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 5,
  },
  unlockGradient: {
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  unlockBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
