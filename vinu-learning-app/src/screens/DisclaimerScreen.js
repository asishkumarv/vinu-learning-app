import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { contentApi } from '../services/api';

export default function DisclaimerScreen({ navigation }) {
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisclaimer();
  }, []);

  const fetchDisclaimer = async () => {
    try {
      setLoading(true);
      const res = await contentApi.getDisclaimer();
      if (res.data && res.data.disclaimer) {
        setContent(res.data.disclaimer);
      } else {
        setContent(fallbackDisclaimer);
      }
    } catch (err) {
      console.warn('Could not fetch disclaimer from server, using local fallback:', err);
      setContent(fallbackDisclaimer);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format/render disclaimer text elements nicely
  const renderDisclaimerText = (text) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      // Document title
      if (trimmed === 'VINUH — EDUCATIONAL DISCLAIMER & LIMITATION OF LIABILITY') {
        return (
          <Text key={idx} style={[styles.docTitle, { color: colors.text }]}>
            {trimmed}
          </Text>
        );
      }
      
      // Main headers (e.g. "AI-ASSISTED OR TECHNOLOGY-ASSISTED CONTENT")
      const isHeader = /^[A-Z\s\-]{4,}$/.test(trimmed) && !trimmed.includes('EFFECTIVE');
      if (isHeader) {
        return (
          <Text key={idx} style={[styles.sectionHeader, { color: colors.primary }]}>
            {trimmed}
          </Text>
        );
      }
      
      // Subtitles or bold sections
      if (trimmed.startsWith('Effective Date:') || trimmed.startsWith('Last Updated:')) {
        return (
          <Text key={idx} style={[styles.metaText, { color: colors.textSecondary }]}>
            {trimmed}
          </Text>
        );
      }
      
      // Bullet points
      if (trimmed.startsWith('*')) {
        return (
          <View key={idx} style={styles.bulletRow}>
            <Text style={[styles.bulletPoint, { color: colors.primary }]}>•</Text>
            <Text style={[styles.bulletText, { color: colors.text }]}>
              {trimmed.substring(1).trim()}
            </Text>
          </View>
        );
      }
      
      // Standard paragraph
      if (trimmed.length > 0) {
        return (
          <Text key={idx} style={[styles.paragraph, { color: colors.text }]}>
            {trimmed}
          </Text>
        );
      }
      
      // Empty line / spacer
      return <View key={idx} style={{ height: 10 }} />;
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.backBtn, { backgroundColor: colors.chip }]} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Disclaimer</Text>
        <View style={{ width: 40 }} /> 
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 10, color: colors.textSecondary }}>Loading disclaimer...</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderDisclaimerText(content)}
          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  docTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 30,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
    opacity: 0.9,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 10,
  },
  bulletPoint: {
    fontSize: 16,
    marginRight: 8,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.9,
  },
});

const fallbackDisclaimer = `VINUH — EDUCATIONAL DISCLAIMER & LIMITATION OF LIABILITY

Effective Date: 26/08/2026

Vinuh makes reasonable efforts to provide useful, accurate and educational content. However:

* Educational content may contain errors, omissions, outdated information or differences of interpretation;
* Content may be prepared by teachers, subject experts, contributors, editors or technology-assisted systems;
* Vinuh does not guarantee that every lesson, answer, explanation or recommendation is error-free or suitable for every learner;
* Examination patterns, syllabi, regulations, career information and educational requirements may change;
* Users should verify important academic, examination, admission, financial, career or other consequential information from authoritative sources.

Vinuh shall not be responsible for academic results, examination scores, admissions, employment outcomes, career decisions or other consequences arising solely from reliance on content available through the Services.

AI-ASSISTED OR TECHNOLOGY-ASSISTED CONTENT
Where technology, automation or artificial intelligence is used in creating, processing, translating, recommending or presenting educational material, such output may contain inaccuracies or unintended errors.
AI-assisted content is provided for educational and informational purposes and should be independently verified where accuracy is important.
Vinuh does not represent that AI-assisted material is equivalent to professional human advice or officially issued educational material.

LIMITATION OF LIABILITY
To the maximum extent permitted by applicable law, Vinuh and the Company shall not be liable for indirect, incidental, consequential, special or unforeseeable losses arising from use of or inability to use the Services.
The Company does not guarantee educational, academic, examination, employment, financial or career outcomes from use of Vinuh.
Nothing in this Policy is intended to exclude or limit liability that cannot lawfully be excluded or limited under applicable law.`;
