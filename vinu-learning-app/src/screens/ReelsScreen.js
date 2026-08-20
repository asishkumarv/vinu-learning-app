import React, { useState, useRef, useEffect, memo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  Pressable,
  useWindowDimensions,
  StatusBar,
  ActivityIndicator,
  Image,
  PanResponder,
  AppState,
} from 'react-native';
import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { contentApi, progressApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UnlockModal from '../components/UnlockModal';

const ActiveVideoItem = ({
  player,
  item,
  index,
  totalCount,
  isFocused,
  videoHeight,
  videoWidth,
  isCompleted,
  onToggleComplete,
  autoPlay,
  onAutoNext,
  isMuted,
  setIsMuted,
}) => {
  const safeAreaInsets = useSafeAreaInsets();
  const [showSeekFeedback, setShowSeekFeedback] = useState(null);
  const lastTap = useRef(null);

  // Track status and playback states using useEvent
  const playingEvent = useEvent(player, 'playingChange');
  const isPlaying = playingEvent ? playingEvent.isPlaying : player.playing;

  const statusEvent = useEvent(player, 'statusChange');
  const currentStatus = statusEvent ? statusEvent.status : player.status;
  const isLoading = currentStatus === 'loading' || currentStatus === 'idle';

  const timeEvent = useEvent(player, 'timeUpdate');
  const currentTime = timeEvent ? timeEvent.currentTime : player.currentTime;

  const duration = player.duration || 0;

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubbingTime, setScrubbingTime] = useState(0);

  const progressBarRef = useRef(null);
  const progressBarLayout = useRef({ pageX: 0, width: 0 });
  const scrubStateRef = useRef({ duration: 0, player: null, isPlaying: false });
  const wasPlayingBeforeScrub = useRef(false);
  const lastTouchX = useRef(0);

  // Update ref to avoid stale closures in PanResponder
  useEffect(() => {
    scrubStateRef.current = { duration, player, isPlaying };
  }, [duration, player, isPlaying]);

  const onLayoutProgressBar = () => {
    progressBarRef.current?.measure((x, y, width, height, pageX, pageY) => {
      if (width > 0) {
        progressBarLayout.current = { pageX, width };
      }
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        setIsScrubbing(true);
        const { isPlaying: currentlyPlaying, player: currentPlayer } = scrubStateRef.current;
        wasPlayingBeforeScrub.current = currentlyPlaying;
        if (currentlyPlaying && currentPlayer) {
          currentPlayer.pause();
        }

        progressBarRef.current?.measure((x, y, width, height, pageX, pageY) => {
          if (width > 0) {
            progressBarLayout.current = { pageX, width };
            const touchX = evt.nativeEvent.pageX || gestureState.x0;
            lastTouchX.current = touchX;
            const { duration: currentDuration } = scrubStateRef.current;
            if (currentDuration > 0) {
              const pct = Math.max(0, Math.min(1, (touchX - pageX) / width));
              const targetTime = pct * currentDuration;
              setScrubbingTime(targetTime);
            }
          }
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        const { pageX, width } = progressBarLayout.current;
        const { duration: currentDuration } = scrubStateRef.current;
        if (width > 0 && currentDuration > 0) {
          const touchX = evt.nativeEvent.pageX !== undefined && evt.nativeEvent.pageX !== null && evt.nativeEvent.pageX !== 0
            ? evt.nativeEvent.pageX 
            : gestureState.moveX || lastTouchX.current;
          lastTouchX.current = touchX;
          const pct = Math.max(0, Math.min(1, (touchX - pageX) / width));
          const targetTime = pct * currentDuration;
          setScrubbingTime(targetTime);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        setIsScrubbing(false);
        const { pageX, width } = progressBarLayout.current;
        const { duration: currentDuration, player: currentPlayer } = scrubStateRef.current;
        if (width > 0 && currentDuration > 0 && currentPlayer) {
          const touchX = evt.nativeEvent.pageX !== undefined && evt.nativeEvent.pageX !== null && evt.nativeEvent.pageX !== 0
            ? evt.nativeEvent.pageX 
            : lastTouchX.current;
          const pct = Math.max(0, Math.min(1, (touchX - pageX) / width));
          const targetTime = pct * currentDuration;
          if (isFinite(targetTime)) {
            currentPlayer.currentTime = Math.max(0, Math.min(currentDuration, targetTime));
          }
        }
        if (wasPlayingBeforeScrub.current && currentPlayer) {
          currentPlayer.play();
        }
        wasPlayingBeforeScrub.current = false;
      },
      onPanResponderTerminate: () => {
        setIsScrubbing(false);
        const { player: currentPlayer } = scrubStateRef.current;
        if (wasPlayingBeforeScrub.current && currentPlayer) {
          currentPlayer.play();
        }
        wasPlayingBeforeScrub.current = false;
      },
    })
  ).current;

  // Handle mute change
  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  // Listen to video ending (playToEnd)
  useEventListener(player, 'playToEnd', () => {
    console.log('Video finished:', item.title);
    onToggleComplete(item.id, 'completed');
    if (autoPlay) {
      console.log('Auto-playing next video...');
      const nextIndex = index + 1;
      if (nextIndex < totalCount) {
        onAutoNext?.(nextIndex);
      }
    }
  });

  const handleVideoTap = (event) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    const touchX = event.nativeEvent?.pageX || event.nativeEvent?.locationX || 0;

    if (touchX > 0 && lastTap.current && (now - lastTap.current) < DOUBLE_TAP_DELAY) {
      if (touchX < videoWidth / 2) {
        seek(-10);
      } else {
        seek(10);
      }
    } else {
      togglePlayback();
    }
    lastTap.current = now;
  };

  const togglePlayback = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  const seek = (amountSeconds) => {
    if (duration > 0) {
      const newPos = Math.max(0, Math.min(duration, currentTime + amountSeconds));
      if (isFinite(newPos)) {
        player.currentTime = newPos;
        const direction = amountSeconds < 0 ? 'left' : 'right';
        setShowSeekFeedback(direction);
        setTimeout(() => setShowSeekFeedback(null), 600);
      }
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const displayTime = isScrubbing ? scrubbingTime : currentTime;
  const progress = (displayTime / duration) * 100 || 0;
  const controlsBottom = 110;

  return (
    <Pressable onPress={handleVideoTap} style={styles.videoWrapper}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls={false}
        contentFit="contain"
      />

      {showSeekFeedback && (
        <View style={[styles.seekFeedback, showSeekFeedback === 'left' ? { left: 40 } : { right: 40 }]}>
          <View style={styles.seekCircle}>
            <Ionicons name={showSeekFeedback === 'left' ? 'play-back' : 'play-forward'} size={30} color="#FFF" />
          </View>
          <Text style={styles.seekText}>10s</Text>
        </View>
      )}

      {!isPlaying && !showSeekFeedback && !isLoading && (
        <View style={styles.playOverlay}>
          <Ionicons name="play" size={70} color="rgba(255,255,255,0.6)" />
        </View>
      )}

      {/* HUD AND CONTROLS */}
      {!isLoading && (
        <View style={styles.hudContainer} pointerEvents="box-none">
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent']}
            style={styles.topGradient}
            pointerEvents="none"
          />

          <View style={styles.topOverlay} pointerEvents="box-none">
            <View style={styles.detailsContainer}>
              <Text style={styles.titleText}>{item.title}</Text>
              <Text style={styles.authorText}>By {item.author || 'Dr. Vinuh'}</Text>
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
              <Text style={styles.timeLabel}>{formatTime(displayTime)}</Text>
              <View
                ref={progressBarRef}
                onLayout={onLayoutProgressBar}
                {...panResponder.panHandlers}
                style={styles.progressBarContainer}
              >
                <View style={[styles.progressTrack, isScrubbing && styles.progressTrackActive]} />
                <View style={[styles.progressBar, { width: `${progress}%` }, isScrubbing && styles.progressBarActive]} />
                <View style={[styles.progressThumb, { left: `${progress}%` }, isScrubbing && styles.progressThumbActive]} />
              </View>
              <Text style={styles.timeLabel}>{formatTime(duration)}</Text>
            </View>

            <View style={styles.buttonRow} pointerEvents="box-none">
              <TouchableOpacity onPress={() => setIsMuted(!isMuted)} style={styles.iconBtn}>
                <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={22} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (index > 0) onAutoNext?.(index - 1);
                }}
                style={[styles.iconBtn, index === 0 && { opacity: 0.3 }]}
                disabled={index === 0}
              >
                <Ionicons name="play-skip-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => seek(-10)} style={styles.iconBtn}>
                <Ionicons name="play-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={togglePlayback} style={styles.mainPlayBtn}>
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={30} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => seek(10)} style={styles.iconBtn}>
                <Ionicons name="play-forward" size={24} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (index < totalCount - 1) onAutoNext?.(index + 1);
                }}
                style={[styles.iconBtn, index === totalCount - 1 && { opacity: 0.3 }]}
                disabled={index === totalCount - 1}
              >
                <Ionicons name="play-skip-forward" size={24} color="#FFF" />
              </TouchableOpacity>
              <View style={{ width: 44 }} />
            </View>
          </View>
        </View>
      )}

      {/* GLOBAL LOADING OVERLAY */}
      {isLoading && (
        <View style={styles.bufferingOverlay} pointerEvents="none">
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#0084FF" />
            <Text style={styles.loaderText}>Buffering...</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
};

const VideoItem = memo(function VideoItem({
  item,
  index,
  totalCount,
  isActive,
  isFocused,
  videoHeight,
  videoWidth,
  isCompleted,
  onToggleComplete,
  isUnlocked,
  onOpenUnlockModal,
  autoPlay,
  onAutoNext,
  player,
}) {
  const [isMuted, setIsMuted] = useState(false);
  const isLocked = item.is_free === false && !isUnlocked;

  return (
    <View style={[styles.videoContainer, { height: videoHeight, width: videoWidth }]}>
      {isActive && !isLocked && player ? (
        <ActiveVideoItem
          player={player}
          item={item}
          index={index}
          totalCount={totalCount}
          isFocused={isFocused}
          videoHeight={videoHeight}
          videoWidth={videoWidth}
          isCompleted={isCompleted}
          onToggleComplete={onToggleComplete}
          autoPlay={autoPlay}
          onAutoNext={onAutoNext}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
        />
      ) : (
        <View style={styles.videoWrapper}>
          {item.thumbnail_url && (
            <Image
              source={{ uri: item.thumbnail_url }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          )}
          {isLocked ? (
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
          ) : (
            <View style={styles.playOverlay}>
              <Ionicons name="play" size={70} color="rgba(255,255,255,0.6)" />
            </View>
          )}
        </View>
      )}
    </View>
  );
});

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
  const programmaticTargetRef = useRef(null);
  const loadedVideoIdRef = useRef(null);

  // Initialize a single player instance for source reuse
  const activeVideo = videoData[activeVideoIndex];

  const player = useVideoPlayer(null, (playerInstance) => {
    playerInstance.loop = false;
    playerInstance.timeUpdateEventInterval = 0.25;
    playerInstance.showNowPlayingNotification = true;
    playerInstance.staysActiveInBackground = true;
  });

  // Source swapping effect when active track transitions
  useEffect(() => {
    if (activeVideo && player) {
      if (loadedVideoIdRef.current !== activeVideo.id) {
        console.log('Swapping video source to:', activeVideo.title);
        loadedVideoIdRef.current = activeVideo.id;
        const videoUrl = activeVideo.video_url ? activeVideo.video_url : contentApi.getVideoUrl(activeVideo.id);
        player.replace({
          uri: videoUrl,
          metadata: {
            title: activeVideo.title,
            artist: activeVideo.author || 'Dr. Vinuh',
            artwork: activeVideo.thumbnail_url || 'https://img.freepik.com/free-vector/digital-online-education-background-concept-vector_1017-37513.jpg',
          }
        });
        
        // Control play state dynamically on source swap
        if (activeVideo.is_free !== false || unlockedVideos[activeVideo.id]) {
          player.play();
        } else {
          player.pause();
        }
      } else {
        // Same video, check if unlocked status has been updated
        if (activeVideo.is_free === false && unlockedVideos[activeVideo.id]) {
          player.play();
        }
      }
    }
  }, [activeVideoIndex, videoData, unlockedVideos, player, activeVideo]);

  useEffect(() => {
    fetchVideos();
    fetchUserProgress();
    loadUnlockedVideos();
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.videoId, route.params?.chapterId, route.params?.playlistType]);

  useFocusEffect(
    React.useCallback(() => {
      loadSettings();
      return () => {};
    }, [])
  );

  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App returned to foreground. Aligning FlatList scroll with activeVideoIndex:', activeVideoIndex);
        if (flatListRef.current && videoData.length > 0 && activeVideoIndex < videoData.length) {
          try {
            programmaticTargetRef.current = activeVideoIndex;
            flatListRef.current.scrollToIndex({ index: activeVideoIndex, animated: false });
          } catch (err) {
            console.warn('Failed to scroll FlatList on foreground:', err);
          }
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [activeVideoIndex, videoData]);

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
      const chapterId = route.params?.chapterId;
      const playlistType = route.params?.playlistType;

      let response;
      if (chapterId && playlistType !== 'recent') {
        response = await contentApi.getEpisodes(chapterId);
      } else {
        response = await contentApi.getRecentReleases();
      }
      setVideoData(response.data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  useEffect(() => {
    if (route.params?.videoId && videoData.length > 0) {
      const index = videoData.findIndex((v) => Number(v.id) === Number(route.params.videoId));
      if (index !== -1) {
        programmaticTargetRef.current = index;
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
      response.data.forEach((p) => {
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
    setCompletedVideos((prev) => ({ ...prev, [id]: isNowCompleted }));
    try {
      await progressApi.updateProgress({ episode_id: id, status: newStatus });
    } catch (error) {
      console.warn('Could not sync progress with server:', error?.message || error);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const visibleIndex = viewableItems[0].index;
      if (programmaticTargetRef.current !== null) {
        if (visibleIndex === programmaticTargetRef.current) {
          programmaticTargetRef.current = null;
        }
        return;
      }
      setActiveVideoIndex(visibleIndex);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 30 }).current;

  const initialIndex = route.params?.videoId && videoData.length > 0
    ? videoData.findIndex((v) => Number(v.id) === Number(route.params.videoId))
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
              player={player}
              onAutoNext={(nextIndex) => {
                programmaticTargetRef.current = nextIndex;
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
          removeClippedSubviews={false}
          maxToRenderPerBatch={3}
          windowSize={5}
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
  progressBarContainer: {
    flex: 1,
    height: 30,
    marginHorizontal: 5,
    justifyContent: 'center',
    position: 'relative',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
  },
  progressTrackActive: {
    height: 6,
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    height: 4,
    backgroundColor: '#0084FF',
    borderRadius: 2,
    zIndex: 1,
  },
  progressBarActive: {
    height: 6,
  },
  progressThumb: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0084FF',
    zIndex: 2,
    transform: [{ translateX: -5 }],
  },
  progressThumbActive: {
    width: 16,
    height: 16,
    borderRadius: 8,
    transform: [{ translateX: -8 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 4,
  },
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
