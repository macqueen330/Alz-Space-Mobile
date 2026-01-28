import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import {
  CheckCircle,
  Circle,
  Trash2,
  Clock,
  Zap,
} from 'lucide-react-native';

import { supabase } from '../../services/supabaseClient';
import { getTasks, toggleTaskCompletion, deleteTask } from '../../services/taskService';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import type { Task, RootStackParamList } from '../../types';
import { formatTime } from '../../utils/formatDate';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export function TaskListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${taskTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(taskId);
              setTasks(prev => prev.filter(t => t.id !== taskId));
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const renderTask = ({ item: task }: { item: Task }) => (
    <TouchableOpacity
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
          <View style={styles.metaItem}>
            <Clock size={14} color={Colors.textSecondary} />
            <Text style={styles.metaText}>
              {formatTime(task.startTime)} - {formatTime(task.endTime)}
            </Text>
          </View>
          <Text style={styles.repeatBadge}>{task.repeat}</Text>
          {task.automationEnabled && (
            <View style={styles.automatedBadge}>
              <Zap size={12} color={Colors.secondary} />
            </View>
          )}
        </View>
        <Text style={styles.assetsCount}>
          {task.assets.length} activities
        </Text>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteTask(task.id, task.title)}
      >
        <Trash2 size={20} color={Colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first task to get started
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgSoft,
  },
  content: {
    padding: Layout.spacing.md,
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
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Layout.spacing.sm,
  },
  metaText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  repeatBadge: {
    fontSize: Layout.fontSize.xs,
    color: Colors.primary,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Layout.spacing.xs,
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.sm,
    marginRight: Layout.spacing.xs,
  },
  automatedBadge: {
    backgroundColor: Colors.secondary + '20',
    padding: 4,
    borderRadius: Layout.borderRadius.sm,
  },
  assetsCount: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
    marginTop: Layout.spacing.xs,
  },
  deleteButton: {
    padding: Layout.spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    padding: Layout.spacing.xxl,
  },
  emptyText: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textMain,
  },
  emptySubtext: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.xs,
  },
});
