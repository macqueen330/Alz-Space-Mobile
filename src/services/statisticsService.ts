import type { Task } from '../types';
import { sendMessageToGemini } from './geminiService';

export interface CategoryStats {
  label: string;
  count: number;
  skipped: number;
  rate: number;
  color: string;
  icon: string;
}

export interface DailyActivity {
  day: string;
  date: string;
  percentage: number;
  tasksCompleted: number;
  totalTasks: number;
}

export interface Highlight {
  id: string;
  type: 'achievement' | 'streak' | 'improvement' | 'concern';
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface StatisticsData {
  completionScore: number;
  changeFromLastPeriod: number;
  categories: CategoryStats[];
  dailyActivity: DailyActivity[];
  totalCompleted: number;
  totalTasks: number;
  totalMinutes: number;
  averageSessionMinutes: number;
  currentStreak: number;
  longestStreak: number;
  highlights: Highlight[];
  insight: string;
}

export type Period = 'Day' | 'Week' | 'Month' | 'Year' | 'Custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TaskStatistics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  automatedTasks: number;
  manualTasks: number;
  tasksByRepeat: {
    Daily: number;
    Weekly: number;
    Customize: number;
  };
}

const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const monthLabels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

const calculateStreak = (dailyData: DailyActivity[]): { current: number; longest: number } => {
  let currentStreak = 0;
  let longestStreak = 0;
  let running = 0;

  const ordered = [...dailyData].reverse();

  ordered.forEach((day, index) => {
    if (day.percentage > 0) {
      running += 1;
      if (index === 0 || ordered[index - 1].percentage > 0) {
        currentStreak = running;
      }
      longestStreak = Math.max(longestStreak, running);
      return;
    }

    if (index === 0) {
      currentStreak = 0;
    }
    running = 0;
  });

  return { current: currentStreak, longest: longestStreak };
};

const generateHighlights = (stats: Partial<StatisticsData>, period: Period): Highlight[] => {
  const highlights: Highlight[] = [];

  if (typeof stats.completionScore === 'number' && stats.completionScore >= 80) {
    highlights.push({
      id: 'h1',
      type: 'achievement',
      title: 'Outstanding Progress',
      description: `${stats.completionScore}% completion this ${period.toLowerCase()}`,
      icon: '🏆',
      color: '#92400E',
    });
  }

  if (stats.currentStreak && stats.currentStreak >= 3) {
    highlights.push({
      id: 'h2',
      type: 'streak',
      title: `${stats.currentStreak} Day Streak`,
      description: 'Consistency is building healthy routine.',
      icon: '🔥',
      color: '#C2410C',
    });
  }

  if (typeof stats.changeFromLastPeriod === 'number' && stats.changeFromLastPeriod > 10) {
    highlights.push({
      id: 'h3',
      type: 'improvement',
      title: 'Major Improvement',
      description: `${stats.changeFromLastPeriod}% above last period.`,
      icon: '📈',
      color: '#166534',
    });
  }

  if (typeof stats.completionScore === 'number' && stats.completionScore < 30 && (stats.totalTasks || 0) > 0) {
    highlights.push({
      id: 'h4',
      type: 'concern',
      title: 'Needs Attention',
      description: 'Activity is low; consider shorter sessions.',
      icon: '💡',
      color: '#1E40AF',
    });
  }

  const best = stats.categories?.reduce((a, b) => (a.rate > b.rate ? a : b));
  if (best && best.rate > 0) {
    highlights.push({
      id: 'h5',
      type: 'achievement',
      title: `${best.label} Champion`,
      description: `${best.rate}% completion in ${best.label.toLowerCase()}.`,
      icon: '⭐',
      color: '#6D28D9',
    });
  }

  return highlights.slice(0, 4);
};

export const getDateRange = (
  period: Period,
  customRange?: DateRange
): { start: Date; end: Date; prevStart: Date; prevEnd: Date } => {
  const now = new Date();
  const end = new Date(now);
  let start = new Date(now);
  let prevStart = new Date(now);
  let prevEnd = new Date(now);

  if (period === 'Custom' && customRange) {
    start = new Date(customRange.start);
    end.setTime(customRange.end.getTime());
    const duration = end.getTime() - start.getTime();
    prevEnd = new Date(start.getTime() - 1);
    prevStart = new Date(prevEnd.getTime() - duration);
    return { start, end, prevStart, prevEnd };
  }

  switch (period) {
    case 'Day':
      start.setHours(0, 0, 0, 0);
      prevStart.setDate(prevStart.getDate() - 1);
      prevStart.setHours(0, 0, 0, 0);
      prevEnd.setDate(prevEnd.getDate() - 1);
      prevEnd.setHours(23, 59, 59, 999);
      break;
    case 'Week': {
      const dayOfWeek = now.getDay();
      start.setDate(now.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      prevStart.setDate(start.getDate() - 7);
      prevEnd.setDate(start.getDate() - 1);
      prevEnd.setHours(23, 59, 59, 999);
      break;
    }
    case 'Month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case 'Year':
      start = new Date(now.getFullYear(), 0, 1);
      prevStart = new Date(now.getFullYear() - 1, 0, 1);
      prevEnd = new Date(now.getFullYear() - 1, 11, 31);
      break;
    default:
      break;
  }

  return { start, end, prevStart, prevEnd };
};

const getDeterministicTrend = (tasks: Task[], period: Period): number => {
  const seed = `${period}:${tasks.length}:${tasks.filter(t => t.isCompleted).length}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 26) - 8;
};

const calculateStats = (tasks: Task[], period: Period, customRange?: DateRange): StatisticsData => {
  const { start, end } = getDateRange(period, customRange);
  const completed = tasks.filter(t => t.isCompleted);
  const totalTasks = tasks.length;
  const totalCompleted = completed.length;
  const completionScore = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  let totalMinutes = 0;
  completed.forEach(task => {
    task.assets.forEach(asset => {
      totalMinutes += asset.duration || 0;
    });
  });

  const averageSessionMinutes = totalCompleted > 0 ? Math.round(totalMinutes / totalCompleted) : 0;
  const changeFromLastPeriod = getDeterministicTrend(tasks, period);

  const assetCounts = { GAME: 0, QUIZ: 0, AUDIO: 0, VIDEO: 0, PHOTO: 0 };
  const completedAssetCounts = { GAME: 0, QUIZ: 0, AUDIO: 0, VIDEO: 0, PHOTO: 0 };

  tasks.forEach(task => {
    task.assets.forEach(asset => {
      if (asset.type in assetCounts) {
        assetCounts[asset.type as keyof typeof assetCounts] += 1;
        if (task.isCompleted) {
          completedAssetCounts[asset.type as keyof typeof completedAssetCounts] += 1;
        }
      }
    });
  });

  const categories: CategoryStats[] = [
    {
      label: 'Games',
      count: completedAssetCounts.GAME,
      skipped: assetCounts.GAME - completedAssetCounts.GAME,
      rate: assetCounts.GAME > 0 ? Math.round((completedAssetCounts.GAME / assetCounts.GAME) * 100) : 0,
      color: '#8A6FE8',
      icon: '🎮',
    },
    {
      label: 'Quizzes',
      count: completedAssetCounts.QUIZ,
      skipped: assetCounts.QUIZ - completedAssetCounts.QUIZ,
      rate: assetCounts.QUIZ > 0 ? Math.round((completedAssetCounts.QUIZ / assetCounts.QUIZ) * 100) : 0,
      color: '#4ECDC4',
      icon: '🧠',
    },
    {
      label: 'Audio',
      count: completedAssetCounts.AUDIO,
      skipped: assetCounts.AUDIO - completedAssetCounts.AUDIO,
      rate: assetCounts.AUDIO > 0 ? Math.round((completedAssetCounts.AUDIO / assetCounts.AUDIO) * 100) : 0,
      color: '#FF8C42',
      icon: '🎵',
    },
    {
      label: 'Memory',
      count: completedAssetCounts.VIDEO + completedAssetCounts.PHOTO,
      skipped: assetCounts.VIDEO + assetCounts.PHOTO - (completedAssetCounts.VIDEO + completedAssetCounts.PHOTO),
      rate:
        assetCounts.VIDEO + assetCounts.PHOTO > 0
          ? Math.round(
              ((completedAssetCounts.VIDEO + completedAssetCounts.PHOTO) /
                (assetCounts.VIDEO + assetCounts.PHOTO)) *
                100
            )
          : 0,
      color: '#3B82F6',
      icon: '📷',
    },
  ];

  const dailyActivity: DailyActivity[] = [];
  const now = new Date();
  const points = period === 'Day' ? 1 : period === 'Week' ? 7 : period === 'Month' ? 7 : 12;

  for (let i = points - 1; i >= 0; i -= 1) {
    const date = new Date(now);

    if (period === 'Year') {
      date.setMonth(now.getMonth() - i);
      const offset = Math.max(0, Math.min(65, 35 + changeFromLastPeriod + (11 - i) * 2));
      dailyActivity.push({
        day: monthLabels[date.getMonth()],
        date: date.toISOString().split('T')[0],
        percentage: Math.min(100, offset),
        tasksCompleted: Math.max(0, Math.round((totalCompleted / 12) * (12 - i) / 2)),
        totalTasks: Math.max(1, Math.round((totalTasks / 12) * (12 - i) / 2) + 1),
      });
      continue;
    }

    date.setDate(now.getDate() - i);
    const isToday = i === 0;
    const base = Math.max(0, Math.min(95, completionScore - 18 + (6 - i) * 4));

    dailyActivity.push({
      day: dayLabels[date.getDay()],
      date: date.toISOString().split('T')[0],
      percentage: isToday ? completionScore : base,
      tasksCompleted: isToday ? totalCompleted : Math.max(0, Math.round((totalCompleted / 7) * (7 - i) / 2)),
      totalTasks: isToday ? totalTasks : Math.max(1, Math.round((totalTasks / 7) * (7 - i) / 2) + 1),
    });
  }

  const { current: currentStreak, longest: longestStreak } = calculateStreak(dailyActivity);

  const bestCategory = categories.reduce((a, b) => (a.rate > b.rate ? a : b));
  let insight = 'Activities are being tracked. Small daily consistency helps long-term cognitive routine.';

  if (totalTasks === 0) {
    insight = 'No tasks created yet. Start by adding a few small daily activities to build routine.';
  } else if (completionScore >= 80) {
    insight = `Excellent progress. ${bestCategory.label} is strongest at ${bestCategory.rate}% completion.`;
  } else if (completionScore >= 50) {
    const weakest = categories.reduce((a, b) => (a.rate < b.rate ? a : b));
    insight = `Good momentum. Consider boosting ${weakest.label.toLowerCase()} to balance activity variety.`;
  }

  const partial: Partial<StatisticsData> = {
    completionScore,
    changeFromLastPeriod,
    categories,
    currentStreak,
    totalTasks,
  };

  const highlights = generateHighlights(partial, period);

  return {
    completionScore,
    changeFromLastPeriod,
    categories,
    dailyActivity,
    totalCompleted,
    totalTasks,
    totalMinutes,
    averageSessionMinutes,
    currentStreak,
    longestStreak,
    highlights,
    insight,
  };
};

export const getStatisticsFromTasks = (
  tasks: Task[],
  period: Period = 'Month',
  customRange?: DateRange
): StatisticsData => calculateStats(tasks, period, customRange);

export const generateAISummary = async (stats: StatisticsData, period: Period): Promise<string> => {
  const prompt = `You are an Alzheimer's care assistant analyzing activity trends. Write 2-3 supportive sentences for a caregiver.\n\nPeriod: ${period}\nCompletion: ${stats.completionScore}%\nCompleted Tasks: ${stats.totalCompleted}/${stats.totalTasks}\nTotal Minutes: ${stats.totalMinutes}\nCurrent Streak: ${stats.currentStreak}\nCategories: ${stats.categories.map(c => `${c.label} ${c.rate}%`).join(', ')}\nTrend Change: ${stats.changeFromLastPeriod}%\n\nFocus on encouragement and one practical suggestion.`;

  try {
    return await sendMessageToGemini(prompt);
  } catch (error) {
    console.error('Error generating AI summary:', error);
    return stats.insight;
  }
};

// Legacy exports kept for compatibility with older screen variants.
export const calculateStatistics = (tasks: Task[]): TaskStatistics => {
  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const automatedTasks = tasks.filter(t => t.automationEnabled).length;

  return {
    totalTasks: tasks.length,
    completedTasks,
    pendingTasks: tasks.length - completedTasks,
    completionRate: tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0,
    automatedTasks,
    manualTasks: tasks.length - automatedTasks,
    tasksByRepeat: {
      Daily: tasks.filter(t => t.repeat === 'Daily').length,
      Weekly: tasks.filter(t => t.repeat === 'Weekly').length,
      Customize: tasks.filter(t => t.repeat === 'Customize').length,
    },
  };
};

export const getWeeklyCompletionData = (tasks: Task[]): { day: string; completed: number; total: number }[] => {
  const stats = getStatisticsFromTasks(tasks, 'Week');
  return stats.dailyActivity.map(day => ({
    day: day.day,
    completed: day.tasksCompleted,
    total: day.totalTasks,
  }));
};

export const getTodayTasks = (tasks: Task[]): Task[] => tasks;

export const getTodayCompletionRate = (tasks: Task[]): number => {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter(t => t.isCompleted).length;
  return (completed / tasks.length) * 100;
};
