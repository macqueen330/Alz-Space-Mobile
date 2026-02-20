import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { MessageCircle, ArrowRightLeft, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../../services/supabaseClient';
import { getTasks } from '../../services/taskService';
import { getFamilyMembers } from '../../services/familyService';
import { Colors } from '../../constants/colors';
import type { Task, FamilyMember, RootStackParamList, TaskType } from '../../types';
import { BrandLogo } from '../../components/common/BrandLogo';
import { CalendarWidget } from '../../components/home/CalendarWidget';
import { HomeTaskItem } from '../../components/home/HomeTaskItem';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const YESTERDAY_TASKS: Task[] = [
  {
    id: 'prev1',
    title: 'Memory Lane',
    startTime: '09:00',
    endTime: '09:30',
    repeat: 'Daily',
    isCompleted: true,
    automationEnabled: false,
    assignedTo: 'Patient',
    assets: [{ id: 'p-a1', type: 'PHOTO' as TaskType, title: 'Old Album', duration: 15 }],
  },
  {
    id: 'prev2',
    title: 'Afternoon Music',
    startTime: '14:00',
    endTime: '14:30',
    repeat: 'Daily',
    isCompleted: true,
    automationEnabled: true,
    assignedTo: 'Patient',
    assets: [{ id: 'p-a2', type: 'AUDIO' as TaskType, title: 'Jazz', duration: 30 }],
  },
];

export function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [userName, setUserName] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [patients, setPatients] = useState<FamilyMember[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPatientIndex, setSelectedPatientIndex] = useState(0);
  const [viewDate, setViewDate] = useState(28);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      const profile = profileData as { name?: string } | null;
      if (profile?.name) {
        setUserName(profile.name);
      }

      const userTasks = await getTasks(user.id);
      setTasks(userTasks);

      const members = await getFamilyMembers(user.id);
      setPatients(members.filter((m) => m.role === 'PATIENT'));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const displayedTasks = useMemo(() => {
    if (viewDate === 27) return YESTERDAY_TASKS;
    if (viewDate === 28) return tasks;
    return [];
  }, [tasks, viewDate]);

  const timelineTasks = useMemo(
    () => displayedTasks.filter((t) => !t.isCompleted).slice(0, 3),
    [displayedTasks]
  );
  const completedCount = displayedTasks.filter((t) => t.isCompleted).length;
  const nextTask = displayedTasks.find((t) => !t.isCompleted);
  const pendingCount = displayedTasks.filter((t) => !t.isCompleted).length;
  const selectedPatient = patients[selectedPatientIndex];

  const handleSwitchPatient = () => {
    if (patients.length <= 1) return;
    setSelectedPatientIndex((prev) => (prev + 1) % patients.length);
  };

  useEffect(() => {
    if (selectedPatientIndex >= patients.length && patients.length > 0) {
      setSelectedPatientIndex(0);
    }
  }, [patients.length, selectedPatientIndex]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.gradientTop} />
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Patient Profile Header */}
        <View style={styles.headerRow}>
          <View style={styles.patientHeaderCard}>
            <View style={styles.patientHeaderGlow} />
            <View style={styles.patientHeaderContent}>
              {selectedPatient?.avatarUrl ? (
                <Image
                  source={{ uri: selectedPatient.avatarUrl }}
                  style={styles.patientHeaderAvatar}
                />
              ) : (
                <View style={styles.patientHeaderAvatar}>
                  <BrandLogo size={56} />
                </View>
              )}
              <View style={styles.patientHeaderInfo}>
                <Text style={styles.patientHeaderName}>
                  {selectedPatient?.name || userName || 'Caregiver'}
                </Text>
                <View style={styles.patientHeaderMetaRow}>
                  <Text style={styles.patientHeaderMeta}>
                    {selectedPatient?.relation || 'Caregiver'}
                    {selectedPatient?.condition ? ` • ${selectedPatient.condition}` : ''}
                  </Text>
                </View>
                <View style={styles.patientHeaderBadges}>
                  {selectedPatient?.age ? (
                    <View style={styles.patientHeaderBadgePrimary}>
                      <Text style={styles.patientHeaderBadgePrimaryText}>{selectedPatient.age} Yrs</Text>
                    </View>
                  ) : null}
                  {selectedPatient?.relation ? (
                    <View style={styles.patientHeaderBadgeSecondary}>
                      <Text style={styles.patientHeaderBadgeSecondaryText}>{selectedPatient.relation}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              {patients.length > 1 ? (
                <TouchableOpacity style={styles.switchButton} onPress={handleSwitchPatient} activeOpacity={0.8}>
                  <ArrowRightLeft size={18} color="#2563EB" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          <TouchableOpacity style={styles.chatButton} onPress={() => navigation.navigate('Chat')}>
            <MessageCircle size={22} color={Colors.bgWhite} />
          </TouchableOpacity>
        </View>

        {/* Next Action Card */}
        {viewDate === 28 && nextTask ? (
          <TouchableOpacity
            style={styles.nextActionWrap}
            onPress={() => navigation.navigate('CreateTask', { task: nextTask })}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.nextActionGlow}
            />
            <View style={styles.nextActionCard}>
              <View style={styles.nextActionLeft}>
                <View style={styles.nextActionIcon}>
                  <Sparkles size={20} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.nextActionLabel}>Next Action</Text>
                  <Text style={styles.nextActionTitle} numberOfLines={1}>{nextTask.title}</Text>
                </View>
              </View>
              <View style={styles.nextActionCount}>
                <Text style={styles.nextActionCountText}>{pendingCount}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : null}

        <CalendarWidget tasks={tasks} onDateSelect={setViewDate} />

        {/* Task Timeline */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>
              {viewDate === 28 ? "Today's Journey" : viewDate === 27 ? "Yesterday's Journey" : 'Planned Journey'}
            </Text>
            <View style={styles.sectionPill}>
              <Text style={styles.sectionPillText}>
                {completedCount}/{displayedTasks.length} DONE
              </Text>
            </View>
          </View>

          <View style={styles.taskTimeline}>
            {timelineTasks.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No tasks for this day</Text>
              </View>
            ) : (
              timelineTasks.map((task, index) => (
                <HomeTaskItem
                  key={task.id}
                  task={task}
                  isLast={index === timelineTasks.length - 1}
                  onPress={() => navigation.navigate('CreateTask', { task })}
                />
              ))
            )}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Quick Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{tasks.length}</Text>
              <Text style={styles.statLabel}>Total Tasks</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{completedCount}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{patients.length}</Text>
              <Text style={styles.statLabel}>Patients</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgWhite },
  gradientTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 128,
    backgroundColor: Colors.secondary, opacity: 0.15,
  },
  blobTopRight: {
    position: 'absolute', top: -50, right: -50, width: 288, height: 288,
    borderRadius: 144, backgroundColor: Colors.secondary, opacity: 0.15,
  },
  blobBottomLeft: {
    position: 'absolute', bottom: -50, left: -50, width: 256, height: 256,
    borderRadius: 128, backgroundColor: Colors.primary, opacity: 0.1,
  },
  content: { padding: 20, paddingBottom: 120 },

  // Patient header
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  patientHeaderCard: {
    flex: 1, borderRadius: 40, borderWidth: 1, borderColor: '#DBEAFE',
    overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.9)',
  },
  patientHeaderGlow: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(59,130,246,0.06)' },
  patientHeaderContent: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16 },
  patientHeaderAvatar: {
    width: 64, height: 64, borderRadius: 16, borderWidth: 2, borderColor: Colors.bgWhite,
  },
  patientHeaderInfo: { flex: 1 },
  patientHeaderName: { fontSize: 20, fontWeight: '900', color: Colors.gray800, letterSpacing: -0.3 },
  patientHeaderMetaRow: { marginTop: 4 },
  patientHeaderMeta: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: '#3B82F6',
  },
  patientHeaderBadges: { flexDirection: 'row', gap: 8, marginTop: 8 },
  patientHeaderBadgePrimary: { backgroundColor: '#DBEAFE', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  patientHeaderBadgePrimaryText: { fontSize: 12, fontWeight: '700', color: '#1D4ED8' },
  patientHeaderBadgeSecondary: {
    backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1, borderColor: '#DBEAFE',
  },
  patientHeaderBadgeSecondaryText: { fontSize: 12, fontWeight: '700', color: '#2563EB' },
  switchButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgWhite,
    borderWidth: 1, borderColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.shadowColor, shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  chatButton: {
    backgroundColor: Colors.primary, width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#FDBA74', shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },

  // Next action
  nextActionWrap: { marginBottom: 16 },
  nextActionGlow: {
    position: 'absolute', top: -2, left: -2, right: -2, bottom: -2, borderRadius: 24, opacity: 0.12,
  },
  nextActionCard: {
    backgroundColor: Colors.bgWhite, borderRadius: 24, padding: 12, borderWidth: 1, borderColor: Colors.gray100,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  nextActionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  nextActionIcon: { backgroundColor: '#FFF7ED', borderRadius: 16, padding: 10 },
  nextActionLabel: {
    fontSize: 10, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2,
  },
  nextActionTitle: { fontSize: 18, fontWeight: '700', color: Colors.gray800 },
  nextActionCount: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.gray800,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.shadowColor, shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  nextActionCountText: { color: Colors.bgWhite, fontSize: 16, fontWeight: '800' },

  // Sections
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionEyebrow: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: Colors.gray500 },
  sectionPill: { backgroundColor: Colors.gray100, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  sectionPillText: { fontSize: 10, fontWeight: '700', color: Colors.gray800 },
  taskTimeline: { backgroundColor: 'transparent' },
  emptyState: { backgroundColor: Colors.bgWhite, borderRadius: 20, padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 13, color: Colors.textSecondary },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  statCard: { flex: 1, backgroundColor: Colors.bgWhite, borderRadius: 16, padding: 12, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
});
