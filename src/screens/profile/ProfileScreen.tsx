import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import {
  AlertCircle,
  BarChart3,
  Bell,
  Check,
  ChevronRight,
  Copy,
  Folder,
  LogOut,
  Mail,
  Plus,
  Search,
  Settings,
  Shield,
  Trash2,
  X,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

import { supabase } from '../../services/supabaseClient';
import { signOut } from '../../services/authService';
import {
  addMemberBySearch,
  createPlaceholderMember,
  deleteFamilyMember,
  getFamilyMembers,
} from '../../services/familyService';
import {
  ensureUserHasUID,
  getMyUID,
  searchUserByIdentifier,
} from '../../services/userSearchService';
import {
  acceptInvitation,
  declineInvitation,
  getReceivedInvitations,
  sendInvitation,
} from '../../services/invitationService';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import type {
  FamilyInvitation,
  FamilyMember,
  RootStackParamList,
  UserSearchResult,
} from '../../types';
import { UserRole } from '../../types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const roleOptions: UserRole[] = [UserRole.CAREGIVER, UserRole.FAMILY_MEMBER, UserRole.PATIENT];

const getRoleLabel = (role: UserRole): string => {
  if (role === UserRole.CAREGIVER) return 'Caregiver';
  if (role === UserRole.PATIENT) return 'Patient';
  return 'Family Member';
};

export function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<{ name?: string; avatar_url?: string; role?: string } | null>(null);
  const [uid, setUid] = useState('');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showInvitations, setShowInvitations] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [identifierInput, setIdentifierInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.FAMILY_MEMBER);
  const [searchResult, setSearchResult] = useState<UserSearchResult | null>(null);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) return;

      setUser(currentUser);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      const currentUid = (await getMyUID(currentUser.id)) || (await ensureUserHasUID(currentUser.id)) || '';
      setUid(currentUid);

      const members = await getFamilyMembers(currentUser.id);
      setFamilyMembers(members);

      try {
        const pendingInvitations = await getReceivedInvitations(currentUser.id);
        setInvitations(pendingInvitations);
      } catch {
        // family_invitations table may not exist yet -- non-fatal
      }
    } catch (error: unknown) {
      console.error('Error loading profile:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCopyUID = async () => {
    if (!uid) return;
    await Clipboard.setStringAsync(uid);
    Alert.alert('Copied', 'Your UID has been copied to clipboard');
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error: unknown) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const resetAddState = () => {
    setIdentifierInput('');
    setSelectedRole(UserRole.FAMILY_MEMBER);
    setSearchResult(null);
    setSearchError('');
  };

  const handleOpenAddModal = () => {
    resetAddState();
    setShowAddModal(true);
  };

  const handleSearchUser = async () => {
    if (identifierInput.trim().length < 3) {
      setSearchError('Please enter at least 3 characters.');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const result = await searchUserByIdentifier(identifierInput.trim());
      if (!result) {
        setSearchError('User not found. You can send an invitation below.');
        return;
      }

      const exists = familyMembers.some(member => member.linkedProfileId === result.id);
      if (exists) {
        setSearchError('This user is already linked in your family.');
        return;
      }

      setSearchResult(result);
      if (result.role === UserRole.PATIENT) {
        setSelectedRole(UserRole.PATIENT);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFoundUser = async () => {
    if (!user || !searchResult) return;

    setIsSubmitting(true);
    try {
      const roleToAssign: UserRole =
        searchResult.role === UserRole.PATIENT ? UserRole.PATIENT : selectedRole;
      await addMemberBySearch(user.id, searchResult, roleToAssign);
      setShowAddModal(false);
      await loadData();
    } catch (error) {
      console.error('Add member error:', error);
      Alert.alert('Error', 'Unable to add member right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInviteUser = async () => {
    if (!user || identifierInput.trim().length < 3) {
      setSearchError('Enter a valid UID or phone to invite.');
      return;
    }

    setIsSubmitting(true);
    try {
      const placeholder = await createPlaceholderMember(user.id, identifierInput.trim(), selectedRole);
      await sendInvitation(user.id, identifierInput.trim(), selectedRole, placeholder.id);
      setShowAddModal(false);
      await loadData();
    } catch (error) {
      console.error('Invite error:', error);
      Alert.alert('Error', 'Unable to send invitation right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = (member: FamilyMember) => {
    Alert.alert('Remove Member', `Remove ${member.name} from family?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFamilyMember(member.id);
            setFamilyMembers(prev => prev.filter(item => item.id !== member.id));
          } catch (error) {
            console.error('Delete member error:', error);
            Alert.alert('Error', 'Unable to remove member.');
          }
        },
      },
    ]);
  };

  const handleAcceptInvitation = async (invitation: FamilyInvitation) => {
    if (!user) return;
    try {
      await acceptInvitation(invitation.id, user.id);
      setInvitations(prev => prev.filter(item => item.id !== invitation.id));
      await loadData();
    } catch (error) {
      console.error('Accept invitation error:', error);
      Alert.alert('Error', 'Unable to accept invitation.');
    }
  };

  const handleDeclineInvitation = async (invitation: FamilyInvitation) => {
    try {
      await declineInvitation(invitation.id);
      setInvitations(prev => prev.filter(item => item.id !== invitation.id));
    } catch (error) {
      console.error('Decline invitation error:', error);
      Alert.alert('Error', 'Unable to decline invitation.');
    }
  };

  const patients = useMemo(
    () => familyMembers.filter(member => member.role === UserRole.PATIENT),
    [familyMembers]
  );
  const caregivers = useMemo(
    () =>
      familyMembers.filter(
        member => member.role === UserRole.CAREGIVER || member.role === UserRole.FAMILY_MEMBER
      ),
    [familyMembers]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.blobTopLeft} />
      <View style={styles.blobBottomRight} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Identity</Text>

        <View style={styles.profileHeader}>
          <Image source={{ uri: profile?.avatar_url || 'https://picsum.photos/100' }} style={styles.avatar} />
          <Text style={styles.name}>{profile?.name || 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          <TouchableOpacity style={styles.uidContainer} onPress={handleCopyUID}>
            <Text style={styles.uidLabel}>My Invite Code</Text>
            <Text style={styles.uidValue}>{uid || 'Generating...'}</Text>
            <Copy size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {invitations.length > 0 ? (
          <View style={styles.section}>
            <TouchableOpacity style={styles.inviteHeader} onPress={() => setShowInvitations(prev => !prev)}>
              <View style={styles.inviteHeaderLeft}>
                <View style={styles.inviteIconWrap}>
                  <Mail size={16} color="#CA8A04" />
                </View>
                <View>
                  <Text style={styles.inviteTitle}>Pending Invitations</Text>
                  <Text style={styles.inviteSubtitle}>{invitations.length} awaiting response</Text>
                </View>
              </View>
              <ChevronRight
                size={18}
                color={Colors.gray400}
                style={{ transform: [{ rotate: showInvitations ? '90deg' : '0deg' }] }}
              />
            </TouchableOpacity>

            {showInvitations ? (
              <View style={styles.inviteList}>
                {invitations.map(invitation => (
                  <View key={invitation.id} style={styles.inviteCard}>
                    <View style={styles.inviteCardInfo}>
                      <Text style={styles.inviteCardTitle}>{invitation.inviterName || 'Someone'} invited you</Text>
                      <Text style={styles.inviteCardMeta}>Role: {getRoleLabel(invitation.invitedRole)}</Text>
                    </View>
                    <View style={styles.inviteActions}>
                      <TouchableOpacity style={styles.inviteDecline} onPress={() => handleDeclineInvitation(invitation)}>
                        <X size={16} color={Colors.gray500} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.inviteAccept} onPress={() => handleAcceptInvitation(invitation)}>
                        <Check size={16} color={Colors.bgWhite} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Family Members</Text>

          {patients.length > 0 ? (
            <View style={styles.memberGroup}>
              <Text style={styles.memberGroupTitle}>Patients</Text>
              {patients.map(member => (
                <View key={member.id} style={styles.memberCard}>
                  <Image source={{ uri: member.avatarUrl }} style={styles.memberAvatar} />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberRole}>{member.relation || 'Patient'}</Text>
                  </View>
                  {!member.isOwner ? (
                    <TouchableOpacity onPress={() => handleDeleteMember(member)}>
                      <Trash2 size={16} color={Colors.gray400} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

          {caregivers.length > 0 ? (
            <View style={styles.memberGroup}>
              <Text style={styles.memberGroupTitle}>Caregivers & Family</Text>
              {caregivers.map(member => (
                <View key={member.id} style={styles.memberCard}>
                  <Image source={{ uri: member.avatarUrl }} style={styles.memberAvatar} />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.isOwner ? 'Myself' : member.name}</Text>
                    <Text style={styles.memberRole}>{getRoleLabel(member.role)}</Text>
                  </View>
                  {!member.isOwner ? (
                    <TouchableOpacity onPress={() => handleDeleteMember(member)}>
                      <Trash2 size={16} color={Colors.gray400} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

          <TouchableOpacity style={styles.addMemberButton} onPress={handleOpenAddModal}>
            <Plus size={18} color={Colors.primary} />
            <Text style={styles.addMemberText}>Add Family Member</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('PatientAISettings')}>
            <Settings size={20} color={Colors.textMain} />
            <Text style={styles.menuText}>AI Settings</Text>
            <ChevronRight size={20} color={Colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Assets')}>
            <Folder size={20} color={Colors.textMain} />
            <Text style={styles.menuText}>Assets Library</Text>
            <ChevronRight size={20} color={Colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Statistics')}>
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

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add Family Member</Text>
                <Text style={styles.modalSubtitle}>Search by UID or phone</Text>
              </View>
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowAddModal(false)}>
                <X size={18} color={Colors.gray600} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchInputWrap}>
              <Search size={18} color={Colors.gray400} />
              <TextInput
                style={styles.searchInput}
                value={identifierInput}
                onChangeText={setIdentifierInput}
                placeholder="e.g. ALZ-ABC123 or phone"
                placeholderTextColor={Colors.gray400}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.searchButton} onPress={handleSearchUser} disabled={isSearching}>
                {isSearching ? (
                  <ActivityIndicator size="small" color={Colors.bgWhite} />
                ) : (
                  <Text style={styles.searchButtonText}>Search</Text>
                )}
              </TouchableOpacity>
            </View>

            {searchError ? (
              <View style={styles.errorBanner}>
                <AlertCircle size={14} color="#DC2626" />
                <Text style={styles.errorText}>{searchError}</Text>
              </View>
            ) : null}

            {searchResult ? (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Image source={{ uri: searchResult.avatarUrl }} style={styles.resultAvatar} />
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{searchResult.name}</Text>
                    <Text style={styles.resultMeta}>{searchResult.uid || searchResult.phone || ''}</Text>
                  </View>
                </View>

                {searchResult.role !== UserRole.PATIENT ? (
                  <View style={styles.roleRow}>
                    {roleOptions.filter(role => role !== UserRole.PATIENT).map(role => (
                      <TouchableOpacity
                        key={role}
                        style={[styles.roleChip, selectedRole === role && styles.roleChipActive]}
                        onPress={() => setSelectedRole(role)}
                      >
                        <Text style={[styles.roleChipText, selectedRole === role && styles.roleChipTextActive]}>
                          {getRoleLabel(role)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}

                <TouchableOpacity style={styles.primaryAction} onPress={handleAddFoundUser} disabled={isSubmitting}>
                  {isSubmitting ? <ActivityIndicator size="small" color={Colors.bgWhite} /> : <Text style={styles.primaryActionText}>Add Member</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.inviteCardLarge}>
                <Text style={styles.inviteLabel}>Send Invitation As</Text>
                <View style={styles.roleRow}>
                  {roleOptions.map(role => (
                    <TouchableOpacity
                      key={role}
                      style={[styles.roleChip, selectedRole === role && styles.roleChipActive]}
                      onPress={() => setSelectedRole(role)}
                    >
                      <Text style={[styles.roleChipText, selectedRole === role && styles.roleChipTextActive]}>
                        {getRoleLabel(role)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.secondaryAction} onPress={handleInviteUser} disabled={isSubmitting}>
                  {isSubmitting ? <ActivityIndicator size="small" color={Colors.bgWhite} /> : <Text style={styles.secondaryActionText}>Send Invitation</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgWhite,
  },
  blobTopLeft: {
    position: 'absolute',
    top: -50,
    left: -40,
    width: 288,
    height: 288,
    borderRadius: 144,
    backgroundColor: 'rgba(78,205,196,0.15)',
  },
  blobBottomRight: {
    position: 'absolute',
    bottom: '20%',
    right: -50,
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: 'rgba(255,140,66,0.15)',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Layout.spacing.lg,
    paddingTop: 16,
    paddingBottom: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.gray800,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  profileHeader: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 40,
    padding: Layout.spacing.lg,
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray50,
    shadowColor: Colors.shadowColor,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: Layout.spacing.md,
    borderWidth: 4,
    borderColor: Colors.bgWhite,
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.gray800,
    letterSpacing: -0.3,
  },
  email: {
    fontSize: 12,
    color: Colors.gray400,
    fontWeight: '700',
    marginTop: Layout.spacing.xs,
  },
  uidContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,140,66,0.08)',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,140,66,0.2)',
    marginTop: Layout.spacing.md,
    gap: 8,
  },
  uidLabel: {
    fontSize: 10,
    color: Colors.gray500,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  uidValue: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.gray800,
    letterSpacing: 1,
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 24,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray50,
    shadowColor: Colors.shadowColor,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.gray800,
    marginBottom: Layout.spacing.md,
  },
  inviteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inviteHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inviteIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.gray800,
  },
  inviteSubtitle: {
    fontSize: 11,
    color: Colors.gray500,
    fontWeight: '600',
    marginTop: 2,
  },
  inviteList: {
    marginTop: 10,
    gap: 8,
  },
  inviteCard: {
    borderWidth: 1,
    borderColor: Colors.gray100,
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgWhite,
  },
  inviteCardInfo: {
    flex: 1,
  },
  inviteCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.gray800,
  },
  inviteCardMeta: {
    marginTop: 2,
    fontSize: 11,
    color: Colors.gray500,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 6,
  },
  inviteDecline: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteAccept: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberGroup: {
    marginBottom: Layout.spacing.md,
  },
  memberGroupTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    color: Colors.gray400,
    textTransform: 'uppercase',
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
    fontSize: 14,
    fontWeight: '700',
    color: Colors.gray800,
  },
  memberRole: {
    fontSize: 12,
    color: Colors.gray400,
    marginTop: 2,
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: Colors.gray200,
    borderRadius: 20,
    borderStyle: 'dashed',
    gap: 8,
  },
  addMemberText: {
    fontSize: 12,
    color: Colors.gray500,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  menuText: {
    flex: 1,
    fontSize: 14,
    color: Colors.gray700,
    marginLeft: Layout.spacing.md,
    fontWeight: '700',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 20,
    borderRadius: 24,
    marginBottom: Layout.spacing.xl,
  },
  signOutText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '900',
    marginLeft: Layout.spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.bgWhite,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    minHeight: 420,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.gray800,
  },
  modalSubtitle: {
    fontSize: 11,
    color: Colors.gray500,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: Colors.bgWhite,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.gray800,
    fontWeight: '600',
  },
  searchButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  searchButtonText: {
    color: Colors.bgWhite,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  resultCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.gray800,
  },
  resultMeta: {
    fontSize: 11,
    color: Colors.gray500,
    marginTop: 2,
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  roleChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.gray200,
    backgroundColor: Colors.bgWhite,
  },
  roleChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.gray600,
  },
  roleChipTextActive: {
    color: Colors.bgWhite,
  },
  primaryAction: {
    marginTop: 12,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  primaryActionText: {
    color: Colors.bgWhite,
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  inviteCardLarge: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.gray100,
    backgroundColor: '#FFFBEB',
  },
  inviteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.gray600,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  secondaryAction: {
    marginTop: 12,
    backgroundColor: '#CA8A04',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: Colors.bgWhite,
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
});
