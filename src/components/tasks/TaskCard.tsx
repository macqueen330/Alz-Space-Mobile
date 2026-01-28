import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, Zap, CheckCircle, Circle, ChevronRight } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import { formatTime } from '../../utils/formatDate';
import type { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  onToggleComplete?: () => void;
}

export function TaskCard({ task, onPress, onToggleComplete }: TaskCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <TouchableOpacity style={styles.checkbox} onPress={onToggleComplete}>
        {task.isCompleted ? (
          <CheckCircle size={24} color={Colors.success} />
        ) : (
          <Circle size={24} color={Colors.gray400} />
        )}
      </TouchableOpacity>

      <View style={styles.content}>
        <Text
          style={[styles.title, task.isCompleted && styles.titleCompleted]}
        >
          {task.title}
        </Text>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Clock size={14} color={Colors.textSecondary} />
            <Text style={styles.metaText}>
              {formatTime(task.startTime)} - {formatTime(task.endTime)}
            </Text>
          </View>

          <View style={styles.badges}>
            <Text style={styles.repeatBadge}>{task.repeat}</Text>
            {task.automationEnabled && (
              <View style={styles.autoBadge}>
                <Zap size={12} color={Colors.secondary} />
              </View>
            )}
          </View>
        </View>

        <Text style={styles.assets}>
          {task.assets.length} activities
        </Text>
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
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkbox: {
    marginRight: Layout.spacing.md,
  },
  content: {
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
    justifyContent: 'space-between',
    marginTop: Layout.spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Layout.spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
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
  autoBadge: {
    backgroundColor: Colors.secondary + '20',
    padding: 4,
    borderRadius: Layout.borderRadius.sm,
  },
  assets: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
    marginTop: Layout.spacing.xs,
  },
});
