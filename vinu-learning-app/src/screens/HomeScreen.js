import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { contentApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UnlockModal from '../components/UnlockModal';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeState, setActiveState] = useState('AP school');
  const [classes, setClasses] = useState([]);
  const [expandedClass, setExpandedClass] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [videos, setVideos] = useState([]);
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unlockedVideos, setUnlockedVideos] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedVideoToUnlock, setSelectedVideoToUnlock] = useState(null);

  useEffect(() => {
    fetchClasses();
    fetchRecentReleases();
    loadUnlockedVideos();
  }, []);

  const loadUnlockedVideos = async () => {
    try {
      const stored = await AsyncStorage.getItem('unlockedVideos');
      if (stored) setUnlockedVideos(JSON.parse(stored));
    } catch (e) { console.error(e); }
  };

  const fetchClasses = async () => {
    try {
      const response = await contentApi.getClasses();
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
      if (error.response?.status === 401) {
        navigation.replace('Login');
      }
    }
  };

  const fetchRecentReleases = async () => {
    try {
      const response = await contentApi.getRecentReleases();
      setReleases(response.data);
    } catch (error) {
      console.error('Error fetching recent releases:', error);
      if (error.response?.status === 401) {
        navigation.replace('Login');
      }
    }
  };

  const handleClassPress = async (clsId) => {
    if (expandedClass === clsId) {
      setExpandedClass(null);
      setSubjects([]);
      setSelectedSubject(null);
      setVideos([]);
    } else {
      setExpandedClass(clsId);
      setLoading(true);
      try {
        const response = await contentApi.getSubjects(clsId);
        setSubjects(response.data);
      } catch (error) {
        console.error('Error fetching subjects:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubjectPress = async (subId) => {
    setSelectedSubject(subId);
    setLoading(true);
    try {
      // For now, chapters and episodes might be simplified or we fetch episodes for the first chapter
      // Here we'll fetch episodes for a subject (maybe we need an API to get all episodes for a subject)
      // I'll assume we need to get chapters first, then episodes for the first chapter for display
      const chaptersRes = await contentApi.getChapters(subId);
      if (chaptersRes.data.length > 0) {
        const episodesRes = await contentApi.getEpisodes(chaptersRes.data[0].id);
        setVideos(episodesRes.data);
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToVideos = (video) => {
    const isFree = video.is_free;
    const isUnlocked = unlockedVideos[video.id];

    if (!isFree && !isUnlocked) {
      setSelectedVideoToUnlock(video);
      setModalVisible(true);
      return;
    }
    navigation.navigate('Videos', { videoId: video.id });
  };

  const handleUnlockSuccess = async () => {
    if (!selectedVideoToUnlock) return;
    const newUnlocked = { ...unlockedVideos, [selectedVideoToUnlock.id]: true };
    setUnlockedVideos(newUnlocked);
    await AsyncStorage.setItem('unlockedVideos', JSON.stringify(newUnlocked));
    setModalVisible(false);
    navigation.navigate('Videos', { videoId: selectedVideoToUnlock.id });
  };

  const renderStateTab = (name, color) => (
    <TouchableOpacity
      style={[
        styles.stateTab,
        { backgroundColor: activeState === name ? colors.surface : colors.chip + '40' },
        activeState === name && styles.activeStateTab
      ]}
      onPress={() => setActiveState(name)}
    >
      <View style={[styles.stateIcon, { backgroundColor: color }]} />
      <Text style={[
        styles.stateTabText,
        { color: activeState === name ? colors.primary : '#FFFFFF' }
      ]}>
        {name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView showsVerticalScrollIndicator={false}>
        
        <LinearGradient
          colors={['#0084FF', '#0055FF']}
          style={[styles.header, { paddingTop: insets.top + 10 }]}
        >
          <View style={styles.topHeader}>
            <View style={styles.logoContainer}>
              <Image source={require('../../assets/logo.png')} style={styles.logo} />
              <View>
                <Text style={styles.headerTitle}>VINU</Text>
                <Text style={styles.headerSubtitle}>Nerchuko</Text>
              </View>
            </View>
            <ThemeToggle />
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.tabsScrollView}
            contentContainerStyle={styles.tabsContentContainer}
          >
            {renderStateTab('AP school', '#00C2FF')}
            {renderStateTab('Telangana school', '#FF5C00')}
            {renderStateTab('Intermediate', '#FF007F')}
            {renderStateTab('Life Skills', '#00FF47')}
          </ScrollView>
        </LinearGradient>

        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Select Class</Text>
            
            {classes.filter(cls => cls.section === activeState).length === 0 && !loading && (
               <View style={styles.comingSoonContainer}>
                 <Ionicons name="construct-outline" size={40} color={colors.textSecondary} />
                 <Text style={[styles.comingSoonText, { color: colors.textSecondary }]}>Classes coming soon...</Text>
               </View>
            )}

            {classes.filter(cls => cls.section === activeState).map((cls) => (
              <View key={cls.id}>
                <TouchableOpacity
                  style={styles.classHeader}
                  onPress={() => handleClassPress(cls.id)}
                >
                  <Text style={[
                    styles.className,
                    { color: expandedClass === cls.id ? colors.primary : colors.text }
                  ]}>
                    {cls.name}
                  </Text>
                  <Ionicons name={expandedClass === cls.id ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                {expandedClass === cls.id && (
                  <View>
                    <View style={styles.subjectsGrid}>
                      {subjects.length === 0 && !loading && (
                        <Text style={{ color: colors.textSecondary, paddingVertical: 10 }}>Subjects coming soon...</Text>
                      )}
                      {subjects.map((sub) => (
                        <TouchableOpacity
                          key={sub.id}
                          style={[
                            styles.subjectChip,
                            { backgroundColor: selectedSubject === sub.id ? colors.primary : colors.chip }
                          ]}
                          onPress={() => handleSubjectPress(sub.id)}
                        >
                          <Text style={[
                            styles.subjectText,
                            { color: selectedSubject === sub.id ? '#FFFFFF' : colors.chipText }
                          ]}>
                            {sub.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {selectedSubject && (
                      <View style={styles.videoList}>
                        <Text style={[styles.videoListTitle, { color: colors.text }]}>
                           Lessons
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {videos.map((video) => {
                            const isFree = video.is_free;
                            const isUnlocked = unlockedVideos[video.id];
                            const isLocked = !isFree && !isUnlocked;

                            return (
                              <TouchableOpacity 
                                key={video.id} 
                                style={[styles.subjectVideoCard, { backgroundColor: colors.chip }]}
                                onPress={() => goToVideos(video)}
                              >
                                <View style={styles.thumbnailContainer}>
                                  <Image 
                                    source={{ uri: video.thumbnail_url || 'https://img.freepik.com/free-vector/digital-online-education-background-concept-vector_1017-37513.jpg' }} 
                                    style={[styles.subjectVideoImage, isLocked && { opacity: 0.6 }]} 
                                    resizeMode="cover"
                                  />
                                  <View style={styles.playIconOverlay}>
                                    <Ionicons name={isLocked ? "lock-closed" : "play"} size={isLocked ? 18 : 20} color="#FFF" />
                                  </View>
                                  {isLocked && (
                                    <View style={styles.lockBadge}>
                                      <Ionicons name="lock-closed" size={10} color="#FFF" />
                                      <Text style={styles.lockBadgeText}>AD</Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={[styles.subjectVideoTitle, { color: colors.text }]} numberOfLines={1}>
                                  {video.title}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                          {videos.length === 0 && !loading && (
                             <View style={styles.comingSoonLesson}>
                               <Ionicons name="time-outline" size={24} color={colors.textSecondary} />
                               <Text style={{color: colors.textSecondary, marginLeft: 10}}>Lessons coming soon...</Text>
                             </View>
                          )}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={24} color={colors.primary} />
            <Text style={[styles.chapterTitle, { color: colors.text }]}>Recent Releases</Text>
          </View>

          <FlatList
            horizontal
            data={releases}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.chapterCard, { backgroundColor: colors.surface }]} onPress={() => goToVideos(item.id)}>
                <Image 
                  source={{ uri: item.thumbnail_url || 'https://img.freepik.com/free-vector/digital-online-education-background-concept-vector_1017-37513.jpg' }} 
                  style={styles.chapterImage} 
                  resizeMode="cover"
                />
                <View style={styles.chapterInfo}>
                   <Text style={[styles.chapterInfoTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                   <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{item.subject_name}</Text>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id.toString()}
          />
        </View>
      </ScrollView>
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
  container: { flex: 1 },
  header: { paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 45, height: 45, borderRadius: 12, backgroundColor: '#FFFFFF', marginRight: 12 },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },
  headerSubtitle: { color: '#FFFFFF', fontSize: 12, opacity: 0.8 },
  tabsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  tabsScrollView: { marginTop: 10 },
  tabsContentContainer: { paddingRight: 20 },
  stateTab: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 12, marginRight: 10 },
  activeStateTab: { elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  stateIcon: { width: 10, height: 10, borderRadius: 2, marginRight: 8 },
  stateTabText: { fontSize: 13, fontWeight: '600' },
  content: { padding: 20, marginTop: -10 },
  card: { borderRadius: 20, padding: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, marginBottom: 25 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 15 },
  classHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  className: { fontSize: 17, fontWeight: '600' },
  subjectsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 15, marginBottom: 10 },
  subjectChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10, marginBottom: 10 },
  subjectText: { fontSize: 13, fontWeight: '500' },
  videoList: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 15 },
  videoListTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 12 },
  subjectVideoCard: { width: 120, borderRadius: 12, marginRight: 15, overflow: 'hidden', paddingBottom: 10 },
  thumbnailContainer: { width: '100%', height: 160, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  subjectVideoImage: { width: '100%', height: '100%' },
  subjectVideoTitle: { fontSize: 13, fontWeight: '600', paddingHorizontal: 8, marginTop: 8 },
  playIconOverlay: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.5)', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  chapterTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  horizontalScroll: { paddingBottom: 25 },
  chapterCard: { width: 120, borderRadius: 15, marginRight: 15, overflow: 'hidden', elevation: 2 },
  chapterImage: { width: '100%', height: 160 },
  chapterInfo: { padding: 10 },
  chapterInfoTitle: { fontSize: 14, fontWeight: 'bold' },
  comingSoonContainer: { alignItems: 'center', padding: 30, opacity: 0.7 },
  comingSoonText: { fontSize: 16, marginTop: 10, fontWeight: '500' },
  comingSoonLesson: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 12, marginVertical: 10 },
  lockBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  lockBadgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold', marginLeft: 3 },
});
