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
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

// Suppress expo-av deprecation warning as per user request to "solve" the visible warning
// Migration to expo-video would require a major rewrite and is recommended for the next development phase.
LogBox.ignoreLogs(['[expo-av]: Video component from `expo-av` is deprecated']);

// Video data will be fetched from the API

const VideoItem = memo(({ item, isActive, isFocused, videoHeight, videoWidth, isCompleted, onToggleComplete }) => {
  const safeAreaInsets = useSafeAreaInsets();
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [showSeekFeedback, setShowSeekFeedback] = useState(null);
  const lastTap = useRef(null);

  useEffect(() => {
    if (!isActive || !isFocused) {
      videoRef.current?.pauseAsync();
    }
  }, [isActive, isFocused]);

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

  const toggleFullscreen = () => {
    videoRef.current?.presentFullscreenPlayer();
  };

  const seek = async (amount, direction) => {
    if (status.positionMillis !== undefined && status.durationMillis) {
      const wasPlaying = status.isPlaying;
      const newPos = Math.max(0, Math.min(status.durationMillis, status.positionMillis + amount));
      if (isFinite(newPos)) {
        await videoRef.current?.setPositionAsync(newPos);
        if (wasPlaying) {
          await videoRef.current?.playAsync();
        }
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
        if (status.isPlaying) {
          videoRef.current?.playAsync();
        }
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

  return (
    <View style={[styles.videoContainer, { height: videoHeight, width: videoWidth }]}>
      <Pressable onPress={handleVideoTap} style={styles.videoWrapper}>
        <Video
          ref={videoRef}
          source={{ uri: contentApi.getVideoUrl(item.id) }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={isActive && isFocused}
          isLooping={false}
          useNativeControls={false}
          isMuted={isMuted}
          onPlaybackStatusUpdate={setStatus}
        />
        
        {showSeekFeedback && (
          <View style={[styles.seekFeedback, showSeekFeedback === 'left' ? { left: 40 } : { right: 40 }]}>
            <View style={styles.seekCircle}>
              <Ionicons name={showSeekFeedback === 'left' ? "play-back" : "play-forward"} size={30} color="#FFF" />
            </View>
            <Text style={styles.seekText}>10s</Text>
          </View>
        )}

        {!status.isPlaying && isActive && !showSeekFeedback && (
          <View style={styles.playOverlay}>
            <Ionicons name="play" size={70} color="rgba(255,255,255,0.6)" />
          </View>
        )}
      </Pressable>
      
      {(!status.isPlaying || !isActive) && (
        <View style={styles.hudContainer} pointerEvents="box-none">
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent']}
            style={styles.topGradient}
            pointerEvents="none"
          />
          
          <View style={styles.topOverlay} pointerEvents="box-none">
            <View style={styles.detailsContainer}>
              <Text style={styles.titleText}>{item.title}</Text>
              <Text style={styles.authorText}>By {item.author}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.completeButton, { backgroundColor: isCompleted ? '#4CAF50' : 'rgba(0,0,0,0.5)' }]}
              onPress={() => onToggleComplete(item.id)}
            >
              <Ionicons name={isCompleted ? 'checkmark-circle' : 'checkmark-circle-outline'} size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.bottomGradient}
            pointerEvents="none"
          />

          <View style={[styles.controlBar, { bottom: 100 + (safeAreaInsets?.bottom || 0) }]} pointerEvents="box-none">
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
              <TouchableOpacity onPress={toggleFullscreen} style={styles.iconBtn}>
                <Ionicons name="expand" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
});

import { contentApi, progressApi } from '../services/api';

export default function ReelsScreen({ route }) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const bottomTabHeight = 85;
  
  const videoHeight = windowHeight - bottomTabHeight - insets.top;
  const videoWidth = windowWidth;

  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [completedVideos, setCompletedVideos] = useState({});
  const [videoData, setVideoData] = useState([]);
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchVideos();
    fetchUserProgress();
  }, []);

  const fetchVideos = async () => {
    try {
      // If videoId is passed, we might want to fetch that specific video or its chapter's videos
      // For now, let's fetch all "recent" videos or something similar for the reels
      const response = await contentApi.getRecentReleases();
      setVideoData(response.data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

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

  useEffect(() => {
    if (route.params?.videoId && videoData.length > 0) {
      const index = videoData.findIndex(v => v.id === route.params.videoId);
      if (index !== -1) {
        setActiveVideoIndex(index);
        setTimeout(() => {
           flatListRef.current?.scrollToIndex({ index, animated: true });
        }, 500);
      }
    }
  }, [route.params?.videoId, videoData]);

  const toggleComplete = async (id) => {
    const isNowCompleted = !completedVideos[id];
    setCompletedVideos(prev => ({ ...prev, [id]: isNowCompleted }));
    
    try {
      await progressApi.updateProgress(id, isNowCompleted ? 'completed' : 'started');
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveVideoIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;

  return (
    <View style={[styles.container, { backgroundColor: '#000', paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <FlatList
        ref={flatListRef}
        data={videoData}
        renderItem={({ item, index }) => (
          <VideoItem 
            item={item}
            isActive={activeVideoIndex === index}
            isFocused={isFocused}
            videoHeight={videoHeight}
            videoWidth={videoWidth}
            isCompleted={completedVideos[item.id]}
            onToggleComplete={toggleComplete}
          />
        )}
        keyExtractor={(item) => item.id}
        pagingEnabled={true}
        disableIntervalMomentum={true}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        snapToInterval={videoHeight}
        snapToAlignment="start"
        decelerationRate={Platform.OS === 'ios' ? 'fast' : 0.9}
        getItemLayout={(data, index) => ({
          length: videoHeight,
          offset: videoHeight * index,
          index,
        })}
        removeClippedSubviews={Platform.OS !== 'web'}
        maxToRenderPerBatch={2}
        windowSize={3}
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
  seekFeedback: { position: 'absolute', top: '40%', alignItems: 'center', zIndex: 10 },
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
});
