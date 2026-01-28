import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, ChevronRight, CheckCircle, Circle } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import { formatTime } from '../../utils/formatDate';
import type { Task } from '../../types';

interface TaskItemProps {
  task: Task;
  onPress?: () => void;
  onToggleComplete?: () => void;
}

export function TaskItem({ task, onPress, onToggleComplete }: TaskItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <TouchableOpacity style={styles.checkbox} onPress={onToggleComplete}>
        {task.isCompleted ? (
          <CheckCircle size={24} color={Colors.success} />
        ) : (
          <Circle size={24} color={Colors.gray400} />
        )}
      </TouchableOpacity>

      <View style={styles.info}>
        <Text
          style={[styles.title, task.isCompleted && styles.titleCompleted]}
        >
          {task.title}
        </Text>
        <View style={styles.meta}>
          <Clock size={14} color={Colors.textSecondary} />
          <Text style={styles.time}>
            {formatTime(task.startTime)} - {formatTime(task.endTime)}
          </Text>
          <Text style={styles.repeat}>{task.repeat}</Text>
        </View>
      </View>

      <ChevronRight size={20} color={Colors.gray400} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
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
  info: {
    flex: 1,
  },
  title: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.textMain,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Layout.spacing.xs,
  },
  time: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Layout.spacing.xs,
    marginRight: Layout.spacing.md,
  },
  repeat: {
    fontSize: Layout.fontSize.xs,
    color: Colors.primary,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Layout.spacing.xs,
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.sm,
  },
});
