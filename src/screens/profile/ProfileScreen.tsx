import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import {
  Settings,
  LogOut,
  Users,
  Bell,
  Shield,
  ChevronRight,
  Copy,
  BarChart3,
  Folder,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

import { supabase } from '../../services/supabaseClient';
import { signOut } from '../../services/authService';
import { getFamilyMembers } from '../../services/familyService';
import { getMyUID } from '../../services/userSearchService';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import type { FamilyMember, RootStackParamList } from '../../types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [uid, setUid] = useState<string>('');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      setUser(currentUser);

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Get UID
      const userUid = await getMyUID(currentUser.id);
      setUid(userUid || '');

      // Get family members
      const members = await getFamilyMembers(currentUser.id);
      setFamilyMembers(members);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCopyUID = async () => {
    if (uid) {
      await Clipboard.setStringAsync(uid);
      Alert.alert('Copied', 'Your UID has been copied to clipboard');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const patients = familyMembers.filter(m => m.role === 'PATIENT');
  const caregivers = familyMembers.filter(m => m.role === 'CAREGIVER' || m.role === 'FAMILY_MEMBER');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: profile?.avatar_url || 'https://picsum.photos/100' }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{profile?.name || 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          
          {/* UID Display */}
          <TouchableOpacity style={styles.uidContainer} onPress={handleCopyUID}>
            <Text style={styles.uidLabel}>Your UID:</Text>
            <Text style={styles.uidValue}>{uid || 'Not set'}</Text>
            <Copy size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Family Members Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Family Members</Text>
          
          {/* Patients */}
          {patients.length > 0 && (
            <View style={styles.memberGroup}>
              <Text style={styles.memberGroupTitle}>Patients</Text>
              {patients.map((member) => (
                <View key={member.id} style={styles.memberCard}>
                  <Image
                    source={{ uri: member.avatarUrl }}
                    style={styles.memberAvatar}
                  />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberRole}>{member.relation}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Caregivers & Family */}
          {caregivers.length > 0 && (
            <View style={styles.memberGroup}>
              <Text style={styles.memberGroupTitle}>Caregivers & Family</Text>
              {caregivers.map((member) => (
                <View key={member.id} style={styles.memberCard}>
                  <Image
                    source={{ uri: member.avatarUrl }}
                    style={styles.memberAvatar}
                  />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {member.isOwner ? 'Myself' : member.name}
                    </Text>
                    <Text style={styles.memberRole}>
                      {member.role === 'CAREGIVER' ? 'Caregiver' : 'Family Member'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.addMemberButton}>
            <Users size={20} color={Colors.primary} />
            <Text style={styles.addMemberText}>Add Family Member</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('PatientAISettings')}
          >
            <Settings size={20} color={Colors.textMain} />
            <Text style={styles.menuText}>AI Settings</Text>
            <ChevronRight size={20} color={Colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Assets')}
          >
            <Folder size={20} color={Colors.textMain} />
            <Text style={styles.menuText}>Assets Library</Text>
            <ChevronRight size={20} color={Colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Statistics')}
          >
            <BarChart3 size={20} color={Colors.textMain} />
            <Text style={styles.menuText}>Statistics</Text>
            <ChevronRight size={20} color={Colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Bell size={20} color={Colors.textMain} />
            <Text style={styles.menuText}>Notifications</Text>
            <ChevronRight size={20} color={Colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Shield size={20} color={Colors.textMain} />
            <Text style={styles.menuText}>Privacy & Security</Text>
            <ChevronRight size={20} color={Colors.gray400} />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgSoft,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Layout.spacing.md,
  },
  profileHeader: {
    backgroundColor: Colors.bgWhite,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: Layout.spacing.md,
  },
  name: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    color: Colors.textMain,
  },
  email: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.xs,
  },
  uidContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    marginTop: Layout.spacing.md,
  },
  uidLabel: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginRight: Layout.spacing.xs,
  },
  uidValue: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: Layout.spacing.sm,
  },
  section: {
    backgroundColor: Colors.bgWhite,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textMain,
    marginBottom: Layout.spacing.md,
  },
  memberGroup: {
    marginBottom: Layout.spacing.md,
  },
  memberGroupTitle: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.sm,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Layout.spacing.md,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: Layout.fontSize.md,
    fontWeight: '500',
    color: Colors.textMain,
  },
  memberRole: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Layout.borderRadius.md,
    borderStyle: 'dashed',
  },
  addMemberText: {
    fontSize: Layout.fontSize.md,
    color: Colors.primary,
    fontWeight: '500',
    marginLeft: Layout.spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  menuText: {
    flex: 1,
    fontSize: Layout.fontSize.md,
    color: Colors.textMain,
    marginLeft: Layout.spacing.md,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgWhite,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Layout.spacing.xl,
  },
  signOutText: {
    fontSize: Layout.fontSize.md,
    color: Colors.error,
    fontWeight: '600',
    marginLeft: Layout.spacing.sm,
  },
});
