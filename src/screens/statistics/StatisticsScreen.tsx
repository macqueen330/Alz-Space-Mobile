import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  ChevronLeft,
  Clock,
  Share2,
  Sparkles,
  Target,
  TrendingUp,
  Flame,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '../../services/supabaseClient';
import { getTasks } from '../../services/taskService';
import {
  DateRange,
  Period,
  generateAISummary,
  getStatisticsFromTasks,
} from '../../services/statisticsService';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import type { Task } from '../../types';

const PERIODS: Period[] = ['Day', 'Week', 'Month', 'Custom'];

const parseDateInput = (value: string): Date | null => {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const parsed = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const formatRangeDate = (date: Date): string => {
  return date.toLocaleDateString();
};

const RadialProgress = ({ percentage }: { percentage: number }) => {
  return (
    <View style={styles.radialWrap}>
      <View style={styles.radialTrack}>
        <View style={[styles.radialFill, { height: `${Math.max(6, percentage)}%` }]} />
      </View>
      <Text style={styles.radialLabel}>{percentage}%</Text>
    </View>
  );
};

export function StatisticsScreen() {
  const navigation = useNavigation();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<Period>('Week');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [showDateModal, setShowDateModal] = useState(false);
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setTasks([]);
        return;
      }

      const userTasks = await getTasks(user.id);
      setTasks(userTasks);
    } catch (error) {
      console.error('Error loading statistics:', error);
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

  const stats = useMemo(() => getStatisticsFromTasks(tasks, period, customRange), [tasks, period, customRange]);

  const isPositiveChange = stats.changeFromLastPeriod >= 0;

  const handlePeriodPress = (value: Period) => {
    if (value === 'Custom') {
      setShowDateModal(true);
      return;
    }

    setPeriod(value);
    setCustomRange(undefined);
    setAiSummary(null);
  };

  const handleApplyCustomRange = () => {
    const start = parseDateInput(startDateInput);
    const end = parseDateInput(endDateInput);

    if (!start || !end) {
      Alert.alert('Invalid date', 'Enter dates as YYYY-MM-DD.');
      return;
    }

    if (start.getTime() > end.getTime()) {
      Alert.alert('Invalid range', 'Start date must be before end date.');
      return;
    }

    setCustomRange({ start, end });
    setPeriod('Custom');
    setAiSummary(null);
    setShowDateModal(false);
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingAI(true);
    try {
      const summary = await generateAISummary(stats, period);
      setAiSummary(summary);
    } catch (error) {
      console.error('AI summary error:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#F8FAFC', '#FFFFFF', 'rgba(255,140,66,0.12)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />

      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={Colors.gray700} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Share2 size={20} color={Colors.gray700} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.periodRow}>
          {PERIODS.map(item => (
            <TouchableOpacity
              key={item}
              style={[styles.periodChip, period === item && styles.periodChipActive]}
              onPress={() => handlePeriodPress(item)}
            >
              {item === 'Custom' ? (
                <View style={styles.periodIconWrap}>
                  <Calendar size={12} color={period === item ? Colors.bgWhite : Colors.gray500} />
                </View>
              ) : null}
              <Text style={[styles.periodText, period === item && styles.periodTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {period === 'Custom' && customRange ? (
          <View style={styles.customRangeRow}>
            <Text style={styles.customRangeText}>{formatRangeDate(customRange.start)}</Text>
            <Text style={styles.customRangeText}>→</Text>
            <Text style={styles.customRangeText}>{formatRangeDate(customRange.end)}</Text>
            <TouchableOpacity onPress={() => setShowDateModal(true)}>
              <Text style={styles.customRangeEdit}>Edit</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.quickStatsRow}>
          <View style={styles.completionCard}>
            <View style={styles.completionTop}>
              <View>
                <Text style={styles.eyebrow}>Completion</Text>
                <View style={styles.completionNumberRow}>
                  <Text style={styles.completionNumber}>{stats.completionScore}</Text>
                  <Text style={styles.completionPercent}>%</Text>
                </View>
                <View style={[styles.changePill, isPositiveChange ? styles.changePillPositive : styles.changePillNegative]}>
                  {isPositiveChange ? (
                    <ArrowUpRight size={11} color="#16A34A" />
                  ) : (
                    <ArrowDownRight size={11} color="#DC2626" />
                  )}
                  <Text style={[styles.changeText, isPositiveChange ? styles.changeTextPositive : styles.changeTextNegative]}>
                    {isPositiveChange ? '+' : ''}
                    {stats.changeFromLastPeriod}%
                  </Text>
                </View>
              </View>
              <RadialProgress percentage={stats.completionScore} />
            </View>
          </View>

          <View style={styles.streakCard}>
            <Flame size={18} color={Colors.bgWhite} />
            <Text style={styles.streakNumber}>{stats.currentStreak}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </View>
        </View>

        <View style={styles.secondaryStatsRow}>
          <View style={styles.secondaryCard}>
            <View style={styles.secondaryHeader}>
              <View style={[styles.secondaryIconWrap, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
                <Target size={14} color="#3B82F6" />
              </View>
              <Text style={styles.secondaryLabel}>Tasks Done</Text>
            </View>
            <View style={styles.secondaryValueRow}>
              <Text style={styles.secondaryValue}>{stats.totalCompleted}</Text>
              <Text style={styles.secondarySubValue}>/ {stats.totalTasks}</Text>
            </View>
          </View>

          <View style={styles.secondaryCard}>
            <View style={styles.secondaryHeader}>
              <View style={[styles.secondaryIconWrap, { backgroundColor: 'rgba(139,92,246,0.1)' }]}>
                <Clock size={14} color="#8B5CF6" />
              </View>
              <Text style={styles.secondaryLabel}>Total Time</Text>
            </View>
            <View style={styles.secondaryValueRow}>
              <Text style={styles.secondaryValue}>{stats.totalMinutes}</Text>
              <Text style={styles.secondarySubValue}>min</Text>
            </View>
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Activity Overview</Text>
            <Text style={styles.panelEyebrow}>{period === 'Year' ? 'Monthly' : 'Daily'}</Text>
          </View>
          <View style={styles.activityRow}>
            {stats.dailyActivity.map(item => {
              const max = Math.max(...stats.dailyActivity.map(d => d.percentage), 1);
              const heightRatio = Math.max(8, Math.round((item.percentage / max) * 100));
              const isLast = item === stats.dailyActivity[stats.dailyActivity.length - 1];
              return (
                <View key={`${item.date}-${item.day}`} style={styles.activityColumn}>
                  <View style={styles.activityBarTrack}>
                    <View
                      style={[
                        styles.activityBar,
                        {
                          height: `${heightRatio}%`,
                          backgroundColor: isLast ? Colors.primary : '#D1D5DB',
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.activityDay, isLast && styles.activityDayCurrent]}>{item.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>By Category</Text>
          <View style={styles.categoryList}>
            {stats.categories.map(category => (
              <View key={category.label} style={styles.categoryRow}>
                <View style={[styles.categoryIcon, { backgroundColor: `${category.color}22` }]}> 
                  <Text>{category.icon}</Text>
                </View>
                <View style={styles.categoryMiddle}>
                  <View style={styles.categoryTopRow}>
                    <Text style={styles.categoryLabel}>{category.label}</Text>
                    <Text style={[styles.categoryRate, { color: category.color }]}>{category.rate}%</Text>
                  </View>
                  <View style={styles.categoryTrack}>
                    <View
                      style={[styles.categoryFill, { width: `${category.rate}%`, backgroundColor: category.color }]}
                    />
                  </View>
                </View>
                <Text style={styles.categoryCount}>
                  {category.count}/{category.count + category.skipped}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {stats.highlights.length > 0 ? (
          <View>
            <Text style={styles.highlightsTitle}>Highlights</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.highlightRow}>
              {stats.highlights.map(item => (
                <View key={item.id} style={styles.highlightCard}>
                  <Text style={styles.highlightIcon}>{item.icon}</Text>
                  <Text style={styles.highlightTitle}>{item.title}</Text>
                  <Text style={styles.highlightDescription}>{item.description}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <View style={styles.aiIconWrap}>
              <Sparkles size={16} color={Colors.bgWhite} />
            </View>
            <Text style={styles.aiTitle}>AI Summary</Text>
          </View>

          <Text style={styles.aiBody}>{aiSummary || stats.insight}</Text>

          <TouchableOpacity
            style={[styles.aiButton, isGeneratingAI && styles.aiButtonDisabled]}
            onPress={handleGenerateSummary}
            disabled={isGeneratingAI}
          >
            <Text style={styles.aiButtonText}>{isGeneratingAI ? 'Analyzing...' : aiSummary ? 'Regenerate' : 'Generate AI Analysis'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <View style={styles.tipIconWrap}>
              <TrendingUp size={18} color={Colors.bgWhite} />
            </View>
            <Text style={styles.tipTitle}>Quick Tip</Text>
          </View>
          <Text style={styles.tipBody}>
            {stats.completionScore >= 70
              ? 'Great progress. Keep the routine consistent to preserve momentum.'
              : 'Try scheduling activities at the same time each day to strengthen routine.'}
          </Text>
        </View>
      </ScrollView>

      <Modal visible={showDateModal} transparent animationType="fade" onRequestClose={() => setShowDateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Date Range</Text>
            <Text style={styles.modalHint}>Use format `YYYY-MM-DD`</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Start date"
              placeholderTextColor={Colors.gray400}
              value={startDateInput}
              onChangeText={setStartDateInput}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.modalInput}
              placeholder="End date"
              placeholderTextColor={Colors.gray400}
              value={endDateInput}
              onChangeText={setEndDateInput}
              autoCapitalize="none"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowDateModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalApply} onPress={handleApplyCustomRange}>
                <Text style={styles.modalApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
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
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(243,244,246,0.8)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.gray800,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Layout.spacing.md,
    paddingBottom: 120,
  },
  periodRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(243,244,246,0.8)',
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginBottom: 8,
  },
  periodChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
    gap: 4,
  },
  periodChipActive: {
    backgroundColor: Colors.bgWhite,
    shadowColor: Colors.shadowColor,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gray500,
  },
  periodTextActive: {
    color: Colors.gray800,
  },
  periodIconWrap: {
    marginTop: -1,
  },
  customRangeRow: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  customRangeText: {
    fontSize: 11,
    color: Colors.gray500,
    fontWeight: '600',
  },
  customRangeEdit: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  completionCard: {
    flex: 2,
    backgroundColor: Colors.bgWhite,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.gray100,
    padding: 14,
    shadowColor: Colors.shadowColor,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  completionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.gray400,
  },
  completionNumberRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 2,
  },
  completionNumber: {
    fontSize: 38,
    fontWeight: '900',
    color: Colors.gray800,
    lineHeight: 42,
  },
  completionPercent: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gray400,
    marginBottom: 4,
    marginLeft: 2,
  },
  changePill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  changePillPositive: {
    backgroundColor: '#DCFCE7',
  },
  changePillNegative: {
    backgroundColor: '#FEE2E2',
  },
  changeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  changeTextPositive: {
    color: '#16A34A',
  },
  changeTextNegative: {
    color: '#DC2626',
  },
  streakCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'space-between',
    shadowColor: '#FB923C',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  streakNumber: {
    marginTop: 12,
    fontSize: 34,
    fontWeight: '900',
    color: Colors.bgWhite,
    lineHeight: 36,
  },
  streakLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  radialWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  radialTrack: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  radialFill: {
    width: '100%',
    backgroundColor: Colors.primary,
  },
  radialLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.gray700,
  },
  secondaryStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  secondaryCard: {
    flex: 1,
    backgroundColor: Colors.bgWhite,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gray100,
    padding: 12,
  },
  secondaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  secondaryIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.gray400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  secondaryValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  secondaryValue: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.gray800,
    lineHeight: 32,
  },
  secondarySubValue: {
    fontSize: 12,
    color: Colors.gray400,
    fontWeight: '700',
  },
  panel: {
    backgroundColor: Colors.bgWhite,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.gray100,
    padding: 14,
    marginBottom: 10,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.gray800,
  },
  panelEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.gray400,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 110,
    gap: 6,
  },
  activityColumn: {
    flex: 1,
    alignItems: 'center',
  },
  activityBarTrack: {
    width: '100%',
    maxWidth: 18,
    height: 84,
    borderRadius: 999,
    justifyContent: 'flex-end',
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  activityBar: {
    width: '100%',
    borderRadius: 999,
  },
  activityDay: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.gray400,
  },
  activityDayCurrent: {
    color: Colors.primary,
  },
  categoryList: {
    marginTop: 12,
    gap: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryMiddle: {
    flex: 1,
  },
  categoryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.gray700,
  },
  categoryRate: {
    fontSize: 12,
    fontWeight: '800',
  },
  categoryTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
  },
  categoryFill: {
    height: 6,
    borderRadius: 999,
  },
  categoryCount: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.gray400,
  },
  highlightsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.gray800,
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  highlightRow: {
    gap: 8,
    paddingBottom: 4,
  },
  highlightCard: {
    width: 170,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.gray100,
    padding: 12,
  },
  highlightIcon: {
    fontSize: 18,
    marginBottom: 3,
  },
  highlightTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.gray800,
  },
  highlightDescription: {
    marginTop: 4,
    fontSize: 11,
    color: Colors.gray500,
    lineHeight: 16,
  },
  aiCard: {
    marginTop: 10,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    borderRadius: 18,
    padding: 14,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  aiIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#5B21B6',
  },
  aiBody: {
    fontSize: 13,
    color: '#6D28D9',
    lineHeight: 20,
  },
  aiButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: '#8B5CF6',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  aiButtonDisabled: {
    opacity: 0.7,
  },
  aiButtonText: {
    color: Colors.bgWhite,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  tipCard: {
    marginTop: 10,
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 14,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tipBody: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 19,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.bgWhite,
    borderRadius: 20,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.gray800,
    marginBottom: 3,
  },
  modalHint: {
    fontSize: 11,
    color: Colors.gray400,
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.gray800,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  modalCancel: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.gray100,
  },
  modalCancelText: {
    color: Colors.gray700,
    fontWeight: '700',
    fontSize: 13,
  },
  modalApply: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  modalApplyText: {
    color: Colors.bgWhite,
    fontWeight: '800',
    fontSize: 13,
  },
});
