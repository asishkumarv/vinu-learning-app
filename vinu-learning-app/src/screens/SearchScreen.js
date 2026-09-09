import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { contentApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SearchScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState(['Biology', 'Physics', 'Social Science']);

  // Load recent searches from storage on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem('@recent_searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load recent searches', e);
    }
  };

  const saveRecentSearch = async (query) => {
    if (!query || !query.trim()) return;
    try {
      const trimmed = query.trim();
      const updated = [trimmed, ...recentSearches.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      await AsyncStorage.setItem('@recent_searches', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save recent search', e);
    }
  };

  const removeRecentSearch = async (queryToRemove) => {
    try {
      const updated = recentSearches.filter((item) => item !== queryToRemove);
      setRecentSearches(updated);
      await AsyncStorage.setItem('@recent_searches', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to remove recent search', e);
    }
  };

  // Perform search call with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await contentApi.searchVideos(searchQuery.trim());
        setResults(response.data || []);
      } catch (error) {
        console.error('Error fetching search results:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleVideoPress = (item) => {
    saveRecentSearch(searchQuery || item.title);
    navigation.navigate('Videos', { videoId: item.id, chapterId: item.chapter_id });
  };

  const formatDuration = (sec) => {
    if (!sec) return '';
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const renderVideoItem = ({ item }) => {
    const subtitle = [item.subject_name, item.chapter_name, item.class_name].filter(Boolean).join(' • ');
    return (
      <TouchableOpacity
        style={[styles.videoResult, { borderBottomColor: colors.border }]}
        onPress={() => handleVideoPress(item)}
      >
        <View style={[styles.videoIcon, { backgroundColor: colors.chip }]}>
          {item.thumbnail_url ? (
            <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} />
          ) : (
            <Ionicons name="play" size={20} color={colors.primary} />
          )}
        </View>
        <View style={styles.videoInfo}>
          <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.videoSub, { color: colors.textSecondary }]} numberOfLines={1}>
            {subtitle || 'Lesson'}
          </Text>
        </View>
        {item.duration ? (
          <Text style={[styles.durationText, { color: colors.textSecondary }]}>
            {formatDuration(item.duration)}
          </Text>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} style={{ marginLeft: 8 }} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      <View style={styles.header}>
        <View style={[styles.searchBar, { backgroundColor: colors.chip }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            placeholder="Search for chapters or subjects..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.input, { color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={false}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {searchQuery === '' ? (
        <ScrollView style={styles.content}>
          {recentSearches.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Searches</Text>
              <View style={styles.recentList}>
                {recentSearches.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.recentItem, { backgroundColor: colors.chip }]}
                    onPress={() => setSearchQuery(item)}
                  >
                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                    <Text style={[styles.recentText, { color: colors.chipText }]}>{item}</Text>
                    <TouchableOpacity onPress={() => removeRecentSearch(item)} style={{ marginLeft: 6 }}>
                      <Ionicons name="close" size={14} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: recentSearches.length > 0 ? 30 : 10 }]}>
            Suggested Topics
          </Text>
          {['Biology', 'Social Science', 'Physics', 'English', 'Maths'].map((topic) => (
            <TouchableOpacity
              key={topic}
              style={[styles.suggestedItem, { borderBottomColor: colors.border }]}
              onPress={() => setSearchQuery(topic)}
            >
              <Ionicons name="trending-up" size={18} color={colors.primary} style={{ marginRight: 15 }} />
              <Text style={[styles.suggestedText, { color: colors.text }]}>{topic}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Searching lessons...</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderVideoItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={80} color={colors.chip} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No lessons found for "{searchQuery}"
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 15 },
  input: { flex: 1, marginLeft: 10, fontSize: 16 },
  content: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  recentList: { flexDirection: 'row', flexWrap: 'wrap' },
  recentItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 10, marginBottom: 10 },
  recentText: { fontSize: 14 },
  suggestedItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
  suggestedText: { fontSize: 16 },
  resultsList: { paddingHorizontal: 20, paddingBottom: 20 },
  videoResult: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  videoIcon: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15, overflow: 'hidden' },
  thumbnail: { width: '100%', height: '100%', borderRadius: 10 },
  videoInfo: { flex: 1 },
  videoTitle: { fontSize: 15, fontWeight: '600' },
  videoSub: { fontSize: 12, marginTop: 3 },
  durationText: { fontSize: 12, fontWeight: '500' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  loadingText: { marginTop: 12, fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 20, fontSize: 16, textAlign: 'center' },
});
