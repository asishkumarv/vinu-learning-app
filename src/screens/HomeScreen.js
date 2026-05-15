import React, { useState } from 'react';
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

const { width } = Dimensions.get('window');

const subjectsList = ['Maths', 'Science', 'Physics', 'Biology', 'Social Science', 'English'];

const classes = [
  { id: '8th', name: '8th Class', subjects: subjectsList, available: 6 },
  { id: '9th', name: '9th Class', subjects: subjectsList, available: 6 },
  { id: '10th', name: '10th Class', subjects: subjectsList, available: 6 },
];

const subjectVideos = {
  'Biology': [
    { id: 'bio1', title: 'Biology Chapter 1', image: 'https://img.freepik.com/free-vector/biology-background-with-microscope_23-2148116518.jpg' },
    { id: 'bio2', title: 'Biology Chapter 2', image: 'https://img.freepik.com/free-vector/human-cell-structure-background_23-2148102431.jpg' },
    { id: 'bio3', title: 'Biology Chapter 3', image: 'https://img.freepik.com/free-vector/science-education-background_23-2148483166.jpg' },
  ],
  'Physics': [
    { id: 'phy1', title: 'Physics Chapter 1', image: 'https://img.freepik.com/free-vector/physics-formulas-concept_23-2148147773.jpg' },
    { id: 'phy2', title: 'Physics Chapter 2', image: 'https://img.freepik.com/free-vector/abstract-optical-fiber-background_23-2148296317.jpg' },
    { id: 'phy3', title: 'Physics Chapter 3', image: 'https://img.freepik.com/free-vector/scientific-formulas-concept_23-2148484168.jpg' },
  ],
  'Social Science': [
    { id: 'soc1', title: 'Social Studies Ch 1', image: 'https://img.freepik.com/free-vector/indian-map-design_1017-15437.jpg' },
    { id: 'soc2', title: 'Social Studies Ch 2', image: 'https://img.freepik.com/free-vector/historical-monuments-concept_23-2148485296.jpg' },
    { id: 'soc3', title: 'Social Studies Ch 3', image: 'https://img.freepik.com/free-vector/geography-background-with-globe_23-2148147775.jpg' },
    { id: 'soc4', title: 'Social Studies Ch 4', image: 'https://img.freepik.com/free-vector/indian-parliament-building-illustration_23-2148484896.jpg' },
  ],
  'Science': [
    { id: 'bio1', title: 'Biology Intro', image: 'https://img.freepik.com/free-vector/biology-background-with-microscope_23-2148116518.jpg' },
    { id: 'phy1', title: 'Physics Intro', image: 'https://img.freepik.com/free-vector/physics-formulas-concept_23-2148147773.jpg' },
  ],
  'Maths': [
    { id: 'phy1', title: 'Calculus Basics', image: 'https://img.freepik.com/free-vector/math-background-with-formulas_23-2148147774.jpg' },
  ],
  'English': [
    { id: 'soc1', title: 'Grammar Part 1', image: 'https://img.freepik.com/free-vector/english-book-background_23-2149483516.jpg' },
  ]
};

const releases = [
  { id: 'bio1', title: 'Biology Chapter 1', subject: 'Biology', date: 'New', image: 'https://img.freepik.com/free-vector/biology-background-with-microscope_23-2148116518.jpg' },
  { id: 'phy1', title: 'Physics Chapter 1', subject: 'Physics', date: 'New', image: 'https://img.freepik.com/free-vector/physics-formulas-concept_23-2148147773.jpg' },
  { id: 'soc1', title: 'Social Studies Ch 1', subject: 'Social', date: 'New', image: 'https://img.freepik.com/free-vector/indian-map-design_1017-15437.jpg' },
];

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeState, setActiveState] = useState('AP');
  const [expandedClass, setExpandedClass] = useState('10th');
  const [selectedSubject, setSelectedSubject] = useState('Biology');

  const goToVideos = (videoId) => {
    navigation.navigate('Videos', { videoId });
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
              <Image source={require('../../assets/logo.jpeg')} style={styles.logo} />
              <View>
                <Text style={styles.headerTitle}>VINU</Text>
                <Text style={styles.headerSubtitle}>Nerchuko</Text>
              </View>
            </View>
            <ThemeToggle />
          </View>

          <View style={styles.tabsContainer}>
            {renderStateTab('AP', '#00C2FF')}
            {renderStateTab('Telangana', '#FF5C00')}
            {renderStateTab('General', '#00FF47')}
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Select Class</Text>
            
            {classes.map((cls) => (
              <View key={cls.id}>
                <TouchableOpacity
                  style={styles.classHeader}
                  onPress={() => setExpandedClass(expandedClass === cls.id ? null : cls.id)}
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
                      {cls.subjects.map((sub) => (
                        <TouchableOpacity
                          key={sub}
                          style={[
                            styles.subjectChip,
                            { backgroundColor: selectedSubject === sub ? colors.primary : colors.chip }
                          ]}
                          onPress={() => setSelectedSubject(sub)}
                        >
                          <Text style={[
                            styles.subjectText,
                            { color: selectedSubject === sub ? '#FFFFFF' : colors.chipText }
                          ]}>
                            {sub}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {selectedSubject && (
                      <View style={styles.videoList}>
                        <Text style={[styles.videoListTitle, { color: colors.text }]}>
                          {selectedSubject} Lessons
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {(subjectVideos[selectedSubject] || []).map((video) => (
                            <TouchableOpacity 
                              key={video.id} 
                              style={[styles.subjectVideoCard, { backgroundColor: colors.chip }]}
                              onPress={() => goToVideos(video.id)}
                            >
                              <Image source={{ uri: video.image }} style={styles.subjectVideoImage} />
                              <Text style={[styles.subjectVideoTitle, { color: colors.text }]} numberOfLines={1}>
                                {video.title}
                              </Text>
                              <View style={styles.playIconOverlay}>
                                <Ionicons name="play" size={20} color="#FFF" />
                              </View>
                            </TouchableOpacity>
                          ))}
                          {(!(subjectVideos[selectedSubject]) || subjectVideos[selectedSubject].length === 0) && (
                             <Text style={{color: colors.textSecondary, padding: 20}}>Coming soon...</Text>
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
                <Image source={{ uri: item.image }} style={styles.chapterImage} />
                <View style={styles.chapterInfo}>
                   <Text style={[styles.chapterInfoTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                   <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{item.subject}</Text>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
          />
        </View>
      </ScrollView>
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
  stateTab: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 12, width: '31%' },
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
  subjectVideoCard: { width: 160, borderRadius: 12, marginRight: 15, overflow: 'hidden', paddingBottom: 10 },
  subjectVideoImage: { width: '100%', height: 90 },
  subjectVideoTitle: { fontSize: 13, fontWeight: '600', paddingHorizontal: 8, marginTop: 8 },
  playIconOverlay: { position: 'absolute', top: 30, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.5)', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  chapterTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  horizontalScroll: { paddingBottom: 25 },
  chapterCard: { width: width * 0.45, borderRadius: 15, marginRight: 15, overflow: 'hidden', elevation: 2 },
  chapterImage: { width: '100%', height: 110 },
  chapterInfo: { padding: 10 },
  chapterInfoTitle: { fontSize: 14, fontWeight: 'bold' },
});
