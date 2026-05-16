import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Switch, 
  Alert, 
  StatusBar, 
  TextInput,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { authApi } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

export default function ProfileScreen() {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  
  const [notifications, setNotifications] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await authApi.getProfile();
      setUser(response.data);
      setNewName(response.data.name);
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (error.response?.status === 401) {
        handleLogout(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!newName.trim()) return;
    try {
      setLoading(true);
      const response = await authApi.updateProfile({ name: newName });
      setUser(response.data.user);
      setIsEditing(false);
      Toast.show({ type: 'success', text1: 'Profile Updated' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Update Failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = (silent = false) => {
    const performLogout = async () => {
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    };

    if (silent) {
      performLogout();
      return;
    }

    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: performLogout, style: "destructive" }
    ]);
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

  if (loading && !user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 10 }]}>
      <StatusBar barStyle={colors.text === '#FFFFFF' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Account</Text>
        <TouchableOpacity onPress={() => handleLogout()} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={28} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={[styles.avatarWrapper, { borderColor: colors.primary }]}>
            <View style={[styles.avatar, { backgroundColor: colors.chip }]}>
              <Ionicons name="person" size={50} color={colors.primary} />
            </View>
          </View>
          
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={[styles.nameInput, { color: colors.text, borderBottomColor: colors.primary }]}
                value={newName}
                onChangeText={setNewName}
                autoFocus
              />
              <View style={styles.editButtons}>
                <TouchableOpacity onPress={() => setIsEditing(false)}>
                  <Text style={{ color: colors.textSecondary }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleUpdateProfile} style={styles.saveBtn}>
                  <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15 }}>
                <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
                <TouchableOpacity onPress={() => setIsEditing(true)} style={{ marginLeft: 10 }}>
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.mobile}</Text>
            </>
          )}

          <View style={[styles.classBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 12 }}>10th Grade</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>LEARNING PROGRESS</Text>
          <View style={[styles.statsRow, { backgroundColor: colors.surface }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>-</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Videos Watched</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>-</Text>
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
            {renderMenuItem('book-outline', 'Study Materials', () => Alert.alert("Coming Soon"))}
            {renderMenuItem('information-circle-outline', 'Privacy Policy', () => Alert.alert("Coming Soon"))}
          </View>
        </View>

        <Text style={styles.versionText}>Vinu Learning App v1.1.0</Text>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  logoutBtn: { padding: 5 },
  scrollContent: { paddingHorizontal: 20 },
  profileCard: { alignItems: 'center', marginVertical: 20 },
  avatarWrapper: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, padding: 3, position: 'relative' },
  avatar: { width: '100%', height: '100%', borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 24, fontWeight: 'bold' },
  email: { fontSize: 14, marginTop: 4 },
  classBadge: { marginTop: 12, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  editContainer: { alignItems: 'center', marginTop: 15, width: '100%' },
  nameInput: { fontSize: 24, fontWeight: 'bold', borderBottomWidth: 1, minWidth: 200, textAlign: 'center', paddingBottom: 5 },
  editButtons: { flexDirection: 'row', marginTop: 10, gap: 20 },
  saveBtn: { paddingHorizontal: 10 },
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
  versionText: { textAlign: 'center', marginTop: 40, opacity: 0.4, fontSize: 12 },
});
