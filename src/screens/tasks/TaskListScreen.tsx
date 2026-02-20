import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { ChevronLeft, Zap, Hand, Trash2, Edit, Plus } from 'lucide-react-native';

import { supabase } from '../../services/supabaseClient';
import { deleteTask, getTasks, toggleAutomation } from '../../services/taskService';
import { Colors } from '../../constants/colors';
import type { Task, RootStackParamList } from '../../types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export function TaskListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [tasks, setTasks] = useState<Task[]>([]);

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

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [])
  );

  const handleToggleAutomation = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    try {
      await toggleAutomation(taskId, !task.automationEnabled);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, automationEnabled: !t.automationEnabled } : t
        )
      );
    } catch (error) {
      console.error('Error toggling automation:', error);
    }
  };

  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    Alert.alert('Delete Task', `Are you sure you want to delete "${taskTitle}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask(taskId);
            setTasks((prev) => prev.filter((t) => t.id !== taskId));
          } catch (error) {
            console.error('Error deleting task:', error);
          }
        },
      },
    ]);
  };

  const calculateDuration = (task: Task) => {
    if (task.automationEnabled && task.autoDuration) return `${task.autoDuration}M`;
    const totalMins = task.assets.reduce((acc, curr) => acc + curr.duration, 0);
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hrs > 0) return `${hrs}H ${mins}M`;
    return `${mins}M`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Background decorations (standardized) */}
      <View style={styles.gradientTop} />
      <View style={styles.blobTopLeft} />

      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color={Colors.gray700} />
        </TouchableOpacity>
        <View style={styles.headerTitlePill}>
          <Text style={styles.headerTitle}>Task Management</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tasks created yet</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {tasks.map((task) => (
              <View key={task.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, task.automationEnabled ? styles.badgeAuto : styles.badgeManual]}>
                    {task.automationEnabled ? <Zap size={10} color={Colors.secondary} /> : <Hand size={10} color={Colors.gray500} />}
                    <Text style={[styles.badgeText, task.automationEnabled ? styles.badgeTextAuto : styles.badgeTextManual]}>
                      {task.automationEnabled ? 'Auto' : 'Manual'}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.toggle} onPress={() => handleToggleAutomation(task.id)}>
                    <View style={[styles.toggleTrack, task.automationEnabled && styles.toggleTrackActive]}>
                      <View style={[styles.toggleThumb, task.automationEnabled && styles.toggleThumbActive]} />
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{task.title}</Text>
                  <Text style={styles.cardMeta}>TOTAL TIME: {calculateDuration(task)}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <TouchableOpacity style={styles.cardAction} onPress={() => handleDeleteTask(task.id, task.title)}>
                    <Trash2 size={14} color={Colors.gray400} />
                    <Text style={styles.cardActionText}>DELETE</Text>
                  </TouchableOpacity>
                  <View style={styles.cardDivider} />
                  <TouchableOpacity style={styles.cardAction} onPress={() => navigation.navigate('CreateTask', { task })}>
                    <Edit size={14} color={Colors.info} />
                    <Text style={[styles.cardActionText, styles.cardActionEdit]}>EDIT</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomCta}>
        <TouchableOpacity
          style={styles.newTaskButton}
          onPress={() => navigation.navigate('CreateTask', {})}
          activeOpacity={0.8}
        >
          <Plus size={18} color={Colors.bgWhite} />
          <Text style={styles.newTaskText}>NEW TASK</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgWhite,
  },

  // ============ Background Decorations ============
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 128,
    backgroundColor: Colors.secondary,
    opacity: 0.15,
  },
  blobTopLeft: {
    position: 'absolute',
    top: 0,
    left: -40,
    width: 384,
    height: 384,
    borderRadius: 192,
    backgroundColor: Colors.secondary,
    opacity: 0.15,
  },

  // ============ Header ============
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 50,
  },
  backButton: {
    minWidth: 44,
    minHeight: 44,
    width: 44,
    height: 44,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadowColor,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTitlePill: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.gray800,
    letterSpacing: -0.3,
  },

  // ============ Content ============
  content: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 140,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    color: Colors.gray400,
    fontWeight: '500',
  },
  list: {
    gap: 16,
  },
  card: {
    backgroundColor: Colors.bgWhite,
    borderRadius: 32,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.gray100,
    shadowColor: Colors.shadowColor,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgeAuto: {
    backgroundColor: '#ECFEFF',
  },
  badgeManual: {
    backgroundColor: Colors.gray100,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  badgeTextAuto: {
    color: Colors.secondary,
  },
  badgeTextManual: {
    color: Colors.gray500,
  },
  toggle: {
    padding: 4,
  },
  toggleTrack: {
    width: 40,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.gray200,
    padding: 2,
  },
  toggleTrackActive: {
    backgroundColor: Colors.secondary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.bgWhite,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  cardBody: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.gray800,
  },
  cardMeta: {
    marginTop: 6,
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '700',
    color: Colors.gray400,
    textTransform: 'uppercase',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardActionText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: Colors.gray400,
  },
  cardActionEdit: {
    color: Colors.info,
  },
  cardDivider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.gray100,
  },
  bottomCta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 32,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  newTaskButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
    shadowColor: '#FDBA74',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  newTaskText: {
    color: Colors.bgWhite,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },
});
