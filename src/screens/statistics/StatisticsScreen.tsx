import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {
  CheckCircle,
  Clock,
  Zap,
  TrendingUp,
  Calendar,
} from 'lucide-react-native';

import { supabase } from '../../services/supabaseClient';
import { getTasks } from '../../services/taskService';
import { calculateStatistics, getWeeklyCompletionData } from '../../services/statisticsService';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import type { Task } from '../../types';

export function StatisticsScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userTasks = await getTasks(user.id);
      setTasks(userTasks);
    } catch (error) {
      console.error('Error loading statistics:', error);
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

  const stats = calculateStatistics(tasks);
  const weeklyData = getWeeklyCompletionData(tasks);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Overview Cards */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: Colors.primary + '15' }]}>
            <TrendingUp size={24} color={Colors.primary} />
            <Text style={[styles.statNumber, { color: Colors.primary }]}>
              {stats.completionRate.toFixed(0)}%
            </Text>
            <Text style={styles.statLabel}>Completion Rate</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors.success + '15' }]}>
            <CheckCircle size={24} color={Colors.success} />
            <Text style={[styles.statNumber, { color: Colors.success }]}>
              {stats.completedTasks}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors.warning + '15' }]}>
            <Clock size={24} color={Colors.warning} />
            <Text style={[styles.statNumber, { color: Colors.warning }]}>
              {stats.pendingTasks}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: Colors.secondary + '15' }]}>
            <Zap size={24} color={Colors.secondary} />
            <Text style={[styles.statNumber, { color: Colors.secondary }]}>
              {stats.automatedTasks}
            </Text>
            <Text style={styles.statLabel}>Automated</Text>
          </View>
        </View>

        {/* Weekly Progress */}
        <Text style={styles.sectionTitle}>Weekly Progress</Text>
        <View style={styles.weeklyCard}>
          <View style={styles.weeklyChart}>
            {weeklyData.map((day, index) => {
              const percentage = day.total > 0 ? (day.completed / day.total) * 100 : 0;
              return (
                <View key={index} style={styles.dayColumn}>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${Math.max(percentage, 5)}%`,
                          backgroundColor:
                            percentage >= 80
                              ? Colors.success
                              : percentage >= 50
                              ? Colors.warning
                              : Colors.gray300,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.dayLabel}>{day.day}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
              <Text style={styles.legendText}>80%+</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
              <Text style={styles.legendText}>50-79%</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.gray300 }]} />
              <Text style={styles.legendText}>{'<50%'}</Text>
            </View>
          </View>
        </View>

        {/* Task Distribution */}
        <Text style={styles.sectionTitle}>Task Schedule</Text>
        <View style={styles.distributionCard}>
          <View style={styles.distributionRow}>
            <Calendar size={20} color={Colors.primary} />
            <Text style={styles.distributionLabel}>Daily Tasks</Text>
            <Text style={styles.distributionValue}>{stats.tasksByRepeat.Daily}</Text>
          </View>
          <View style={styles.distributionRow}>
            <Calendar size={20} color={Colors.secondary} />
            <Text style={styles.distributionLabel}>Weekly Tasks</Text>
            <Text style={styles.distributionValue}>{stats.tasksByRepeat.Weekly}</Text>
          </View>
          <View style={styles.distributionRow}>
            <Calendar size={20} color={Colors.success} />
            <Text style={styles.distributionLabel}>Custom Schedule</Text>
            <Text style={styles.distributionValue}>{stats.tasksByRepeat.Customize}</Text>
          </View>
        </View>

        {/* Task Mode */}
        <Text style={styles.sectionTitle}>Task Mode</Text>
        <View style={styles.modeCard}>
          <View style={styles.modeSection}>
            <Text style={styles.modeValue}>{stats.manualTasks}</Text>
            <Text style={styles.modeLabel}>Manual</Text>
          </View>
          <View style={styles.modeDivider} />
          <View style={styles.modeSection}>
            <Text style={[styles.modeValue, { color: Colors.secondary }]}>
              {stats.automatedTasks}
            </Text>
            <Text style={styles.modeLabel}>Automated</Text>
          </View>
        </View>
      </ScrollView>
    </View>
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
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textMain,
    marginBottom: Layout.spacing.md,
    marginTop: Layout.spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Layout.spacing.xs,
  },
  statCard: {
    width: '48%',
    margin: '1%',
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: Layout.fontSize.xxl,
    fontWeight: 'bold',
    marginTop: Layout.spacing.sm,
  },
  statLabel: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.xs,
  },
  weeklyCard: {
    backgroundColor: Colors.bgWhite,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
  },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 150,
    marginBottom: Layout.spacing.md,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    flex: 1,
    width: '60%',
    backgroundColor: Colors.gray100,
    borderRadius: Layout.borderRadius.sm,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: Layout.borderRadius.sm,
  },
  dayLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.xs,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    paddingTop: Layout.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Layout.spacing.md,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Layout.spacing.xs,
  },
  legendText: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
  },
  distributionCard: {
    backgroundColor: Colors.bgWhite,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  distributionLabel: {
    flex: 1,
    fontSize: Layout.fontSize.md,
    color: Colors.textMain,
    marginLeft: Layout.spacing.md,
  },
  distributionValue: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.primary,
  },
  modeCard: {
    backgroundColor: Colors.bgWhite,
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    flexDirection: 'row',
    marginBottom: Layout.spacing.xl,
  },
  modeSection: {
    flex: 1,
    alignItems: 'center',
  },
  modeDivider: {
    width: 1,
    backgroundColor: Colors.gray200,
  },
  modeValue: {
    fontSize: Layout.fontSize.xxxl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  modeLabel: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.xs,
  },
});
