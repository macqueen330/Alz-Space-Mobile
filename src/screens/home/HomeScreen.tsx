import React, { useEffect, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import {
  MessageCircle,
  Calendar,
  Clock,
  ChevronRight,
  Plus,
} from 'lucide-react-native';

import { supabase } from '../../services/supabaseClient';
import { getTasks } from '../../services/taskService';
import { getFamilyMembers } from '../../services/familyService';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import type { Task, FamilyMember, RootStackParamList, UserRole } from '../../types';
import { formatTime } from '../../utils/formatDate';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [userName, setUserName] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [patients, setPatients] = useState<FamilyMember[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserName(profile.name);
      }

      // Get tasks
      const userTasks = await getTasks(user.id);
      setTasks(userTasks);

      // Get family members (patients)
      const members = await getFamilyMembers(user.id);
      setPatients(members.filter(m => m.role === 'PATIENT'));
    } catch (error) {
      console.error('Error loading data:', error);
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

  const todayTasks = tasks.filter(t => !t.isCompleted).slice(0, 3);
  const completedCount = tasks.filter(t => t.isCompleted).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {userName || 'Caregiver'}</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => navigation.navigate('Chat')}
          >
            <MessageCircle size={24} color={Colors.bgWhite} />
          </TouchableOpacity>
        </View>

        {/* Patient Cards */}
        {patients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Patients</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {patients.map((patient) => (
                <View key={patient.id} style={styles.patientCard}>
                  <Image
                    source={{ uri: patient.avatarUrl }}
                    style={styles.patientAvatar}
                  />
                  <Text style={styles.patientName}>{patient.name}</Text>
                  <Text style={styles.patientRelation}>{patient.relation}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Today's Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Tasks</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TaskList')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {todayTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={48} color={Colors.gray300} />
              <Text style={styles.emptyText}>No pending tasks</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('CreateTask', {})}
              >
                <Plus size={20} color={Colors.bgWhite} />
                <Text style={styles.addButtonText}>Add Task</Text>
              </TouchableOpacity>
            </View>
          ) : (
            todayTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={styles.taskCard}
                onPress={() => navigation.navigate('CreateTask', { task })}
              >
                <View style={styles.taskTime}>
                  <Clock size={16} color={Colors.primary} />
                  <Text style={styles.taskTimeText}>
                    {formatTime(task.startTime)}
                  </Text>
                </View>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskMeta}>
                    {task.assets.length} activities • {task.repeat}
                  </Text>
                </View>
                <ChevronRight size={20} color={Colors.gray400} />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  greeting: {
    fontSize: Layout.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.textMain,
  },
  date: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.xs,
  },
  chatButton: {
    backgroundColor: Colors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: Layout.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textMain,
    marginBottom: Layout.spacing.sm,
  },
  seeAll: {
    fontSize: Layout.fontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  patientCard: {
    backgroundColor: Colors.bgWhite,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginRight: Layout.spacing.sm,
    alignItems: 'center',
    width: 120,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  patientAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: Layout.spacing.sm,
  },
  patientName: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.textMain,
  },
  patientRelation: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  emptyState: {
    backgroundColor: Colors.bgWhite,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.sm,
    marginBottom: Layout.spacing.md,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
  },
  addButtonText: {
    color: Colors.bgWhite,
    fontSize: Layout.fontSize.md,
    fontWeight: '500',
    marginLeft: Layout.spacing.xs,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgWhite,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  taskTime: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.sm,
    marginRight: Layout.spacing.md,
  },
  taskTimeText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.primary,
    marginLeft: Layout.spacing.xs,
    fontWeight: '500',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.textMain,
  },
  taskMeta: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.bgWhite,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    marginHorizontal: Layout.spacing.xs,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: Layout.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.xs,
  },
});
