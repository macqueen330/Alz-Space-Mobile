import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import {
  Plus,
  Clock,
  CheckCircle,
  Circle,
  Zap,
  BarChart3,
} from 'lucide-react-native';

import { supabase } from '../../services/supabaseClient';
import { getTasks, toggleTaskCompletion } from '../../services/taskService';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import type { Task, RootStackParamList } from '../../types';
import { formatTime } from '../../utils/formatDate';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export function TaskDashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const loadTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userTasks = await getTasks(user.id);
      setTasks(userTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const handleToggleComplete = async (taskId: string, currentStatus: boolean) => {
    try {
      await toggleTaskCompletion(taskId, !currentStatus);
      setTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, isCompleted: !currentStatus } : t))
      );
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (selectedFilter === 'pending') return !task.isCompleted;
    if (selectedFilter === 'completed') return task.isCompleted;
    return true;
  });

  const pendingCount = tasks.filter(t => !t.isCompleted).length;
  const completedCount = tasks.filter(t => t.isCompleted).length;
  const automatedCount = tasks.filter(t => t.automationEnabled).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.statsButton}
            onPress={() => navigation.navigate('Statistics')}
          >
            <BarChart3 size={24} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateTask', {})}
          >
            <Plus size={24} color={Colors.bgWhite} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: Colors.primary + '15' }]}>
          <Clock size={20} color={Colors.primary} />
          <Text style={[styles.statNumber, { color: Colors.primary }]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: Colors.success + '15' }]}>
          <CheckCircle size={20} color={Colors.success} />
          <Text style={[styles.statNumber, { color: Colors.success }]}>{completedCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: Colors.secondary + '15' }]}>
          <Zap size={20} color={Colors.secondary} />
          <Text style={[styles.statNumber, { color: Colors.secondary }]}>{automatedCount}</Text>
          <Text style={styles.statLabel}>Automated</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'pending', 'completed'] as const).map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              selectedFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter && styles.filterTextActive,
              ]}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Task List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tasks found</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateTask', {})}
            >
              <Plus size={20} color={Colors.bgWhite} />
              <Text style={styles.createButtonText}>Create Task</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredTasks.map(task => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskCard}
              onPress={() => navigation.navigate('CreateTask', { task })}
            >
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => handleToggleComplete(task.id, task.isCompleted)}
              >
                {task.isCompleted ? (
                  <CheckCircle size={24} color={Colors.success} />
                ) : (
                  <Circle size={24} color={Colors.gray400} />
                )}
              </TouchableOpacity>
              <View style={styles.taskInfo}>
                <Text
                  style={[
                    styles.taskTitle,
                    task.isCompleted && styles.taskTitleCompleted,
                  ]}
                >
                  {task.title}
                </Text>
                <View style={styles.taskMeta}>
                  <Text style={styles.taskTime}>
                    {formatTime(task.startTime)} - {formatTime(task.endTime)}
                  </Text>
                  <Text style={styles.taskRepeat}>{task.repeat}</Text>
                  {task.automationEnabled && (
                    <View style={styles.automatedBadge}>
                      <Zap size={12} color={Colors.secondary} />
                      <Text style={styles.automatedText}>Auto</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgSoft,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Layout.spacing.md,
    backgroundColor: Colors.bgWhite,
  },
  title: {
    fontSize: Layout.fontSize.xxl,
    fontWeight: 'bold',
    color: Colors.textMain,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsButton: {
    marginRight: Layout.spacing.md,
  },
  addButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    padding: Layout.spacing.md,
    paddingTop: 0,
    backgroundColor: Colors.bgWhite,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginHorizontal: Layout.spacing.xs,
  },
  statNumber: {
    fontSize: Layout.fontSize.xl,
    fontWeight: 'bold',
    marginTop: Layout.spacing.xs,
  },
  statLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: Layout.spacing.md,
    backgroundColor: Colors.bgWhite,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Layout.spacing.sm,
    alignItems: 'center',
    borderRadius: Layout.borderRadius.md,
    marginHorizontal: Layout.spacing.xs,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.bgWhite,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Layout.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    padding: Layout.spacing.xxl,
  },
  emptyText: {
    fontSize: Layout.fontSize.lg,
    color: Colors.textSecondary,
    marginBottom: Layout.spacing.md,
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
  },
  createButtonText: {
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
  },
  checkbox: {
    marginRight: Layout.spacing.md,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.textMain,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Layout.spacing.xs,
    flexWrap: 'wrap',
  },
  taskTime: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginRight: Layout.spacing.sm,
  },
  taskRepeat: {
    fontSize: Layout.fontSize.sm,
    color: Colors.primary,
    marginRight: Layout.spacing.sm,
  },
  automatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary + '20',
    paddingHorizontal: Layout.spacing.xs,
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.sm,
  },
  automatedText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.secondary,
    marginLeft: 2,
  },
});
