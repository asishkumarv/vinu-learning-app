import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';

export default function ProfileScreen() {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  
  const [notifications, setNotifications] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);

  const userData = {
    name: "Vinu Learner",
    mobile: "+91 98765 43210",
    email: "learner@vinulearning.com",
    joined: "Member since May 2026",
    class: "10th Grade"
  };

  const handleAction = (title) => {
    Alert.alert("Coming Soon", `${title} feature is currently in development.`);
  };

  const handleLogout = () => {
    console.log("Logout Button Pressed");
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          onPress: () => {
            console.log("Logout confirmed by user");
            try {
              // Try to find the root stack navigator (AppNavigator)
              const root = navigation.getParent() || navigation;
              console.log("Using navigator:", root === navigation ? "Local" : "Parent");
              
              root.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                })
              );
            } catch (error) {
              console.error("Logout Error:", error);
              // Ultimate fallback
              navigation.navigate('Login');
            }
          }, 
          style: "destructive" 
        }
      ]
    );
  };

  const renderMenuItem = (icon, label, onPress, rightElement = null) => (
    <TouchableOpacity 
      style={[styles.menuItem, { borderBottomColor: colors.border }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuLeft}>
        <View style={[styles.iconBg, { backgroundColor: colors.chip }]}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
      </View>
      {rightElement || <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 10 }]}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Account</Text>
        <TouchableOpacity 
          onPress={handleLogout} 
          style={styles.logoutBtn}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Ionicons name="log-out-outline" size={28} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={[styles.avatarWrapper, { borderColor: colors.primary }]}>
            <View style={[styles.avatar, { backgroundColor: colors.chip }]}>
              <Ionicons name="person" size={50} color={colors.primary} />
            </View>
            <TouchableOpacity style={styles.editBadge}>
              <Ionicons name="camera" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{userData.name}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{userData.mobile}</Text>
          <View style={[styles.classBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 12 }}>{userData.class}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>LEARNING PROGRESS</Text>
          <View style={[styles.statsRow, { backgroundColor: colors.surface }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>12</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Videos Watched</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>4</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Quizzes Done</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PREFERENCES</Text>
          <View style={[styles.menuList, { backgroundColor: colors.surface }]}>
            {renderMenuItem('moon-outline', 'Dark Mode', toggleTheme, 
              <Switch value={isDarkMode} onValueChange={toggleTheme} />
            )}
            {renderMenuItem('notifications-outline', 'Push Notifications', () => setNotifications(!notifications), 
              <Switch value={notifications} onValueChange={setNotifications} />
            )}
            {renderMenuItem('play-outline', 'Auto-play Videos', () => setAutoPlay(!autoPlay), 
              <Switch value={autoPlay} onValueChange={setAutoPlay} />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SUPPORT & ABOUT</Text>
          <View style={[styles.menuList, { backgroundColor: colors.surface }]}>
            {renderMenuItem('book-outline', 'Study Materials', () => handleAction('Study Materials'))}
            {renderMenuItem('help-circle-outline', 'Help Center', () => handleAction('Help Center'))}
            {renderMenuItem('information-circle-outline', 'Privacy Policy', () => handleAction('Privacy Policy'))}
            {renderMenuItem('star-outline', 'Rate Us', () => handleAction('Rate Us'))}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.logoutListItem, { backgroundColor: colors.surface }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={20} color="#FF3B30" />
            <Text style={[styles.logoutLabel, { color: "#FF3B30" }]}>Logout from Device</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>Vinu Learning App v1.0.0</Text>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  logoutBtn: { padding: 5, zIndex: 100 },
  scrollContent: { paddingHorizontal: 20 },
  profileCard: { alignItems: 'center', marginVertical: 20 },
  avatarWrapper: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, padding: 3, position: 'relative' },
  avatar: { width: '100%', height: '100%', borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  editBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#0084FF', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  name: { fontSize: 24, fontWeight: 'bold', marginTop: 15 },
  email: { fontSize: 14, marginTop: 4 },
  classBadge: { marginTop: 12, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  section: { marginTop: 30 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 10, marginLeft: 5 },
  statsRow: { flexDirection: 'row', borderRadius: 20, padding: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginTop: 4 },
  statDivider: { width: 1, height: '80%' },
  menuList: { borderRadius: 20, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBg: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuLabel: { fontSize: 16, fontWeight: '500' },
  logoutListItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 20, elevation: 1 },
  logoutLabel: { marginLeft: 10, fontSize: 16, fontWeight: 'bold' },
  versionText: { textAlign: 'center', marginTop: 40, opacity: 0.4, fontSize: 12 },
});
