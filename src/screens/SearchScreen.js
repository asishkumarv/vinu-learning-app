import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const allVideos = [
  { id: 'bio1', title: 'Biology Chapter 1', subject: 'Biology', author: 'Dr. Vinu' },
  { id: 'bio2', title: 'Biology Chapter 2', subject: 'Biology', author: 'Dr. Vinu' },
  { id: 'bio3', title: 'Biology Chapter 3', subject: 'Biology', author: 'Dr. Vinu' },
  { id: 'phy1', title: 'Physics Chapter 1', subject: 'Physics', author: 'Prof. Sharma' },
  { id: 'phy2', title: 'Physics Chapter 2', subject: 'Physics', author: 'Prof. Sharma' },
  { id: 'phy3', title: 'Physics Chapter 3', subject: 'Physics', author: 'Prof. Sharma' },
  { id: 'soc1', title: 'Social Studies Chapter 1', subject: 'Social Science', author: 'Ms. Lohitha' },
  { id: 'soc2', title: 'Social Studies Chapter 2', subject: 'Social Science', author: 'Ms. Lohitha' },
  { id: 'soc3', title: 'Social Studies Chapter 3', subject: 'Social Science', author: 'Ms. Lohitha' },
  { id: 'soc4', title: 'Social Studies Chapter 4', subject: 'Social Science', author: 'Ms. Lohitha' },
];

export default function SearchScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState(['Physics', 'Biology', 'Social Studies']);

  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return allVideos.filter(v => 
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleVideoPress = (videoId) => {
    navigation.navigate('Videos', { videoId });
    if (searchQuery && !recentSearches.includes(searchQuery)) {
      setRecentSearches(prev => [searchQuery, ...prev].slice(0, 5));
    }
  };

  const renderVideoItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.videoResult, { borderBottomColor: colors.border }]}
      onPress={() => handleVideoPress(item.id)}
    >
      <View style={[styles.videoIcon, { backgroundColor: colors.chip }]}>
        <Ionicons name="play" size={20} color={colors.primary} />
      </View>
      <View style={styles.videoInfo}>
        <Text style={[styles.videoTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.videoSub, { color: colors.textSecondary }]}>{item.subject} • {item.author}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );

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
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 30 }]}>Suggested Topics</Text>
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
      ) : (
        <FlatList
          data={filteredVideos}
          renderItem={renderVideoItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={80} color={colors.chip} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No lessons found for "{searchQuery}"</Text>
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
  recentItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, marginBottom: 10 },
  recentText: { fontSize: 14 },
  suggestedItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
  suggestedText: { fontSize: 16 },
  resultsList: { paddingHorizontal: 20 },
  videoResult: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
  videoIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  videoInfo: { flex: 1 },
  videoTitle: { fontSize: 16, fontWeight: '600' },
  videoSub: { fontSize: 12, marginTop: 2 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 20, fontSize: 16 },
});
