import { supabase } from './supabaseClient';
import type { Task } from '../types';

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

// Calculate statistics from tasks
export const calculateStatistics = (tasks: Task[]): TaskStatistics => {
  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const pendingTasks = tasks.filter(t => !t.isCompleted).length;
  const automatedTasks = tasks.filter(t => t.automationEnabled).length;
  
  const tasksByRepeat = {
    Daily: tasks.filter(t => t.repeat === 'Daily').length,
    Weekly: tasks.filter(t => t.repeat === 'Weekly').length,
    Customize: tasks.filter(t => t.repeat === 'Customize').length,
  };

  return {
    totalTasks: tasks.length,
    completedTasks,
    pendingTasks,
    completionRate: tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0,
    automatedTasks,
    manualTasks: tasks.length - automatedTasks,
    tasksByRepeat,
  };
};

// Get weekly completion data (last 7 days)
export const getWeeklyCompletionData = (tasks: Task[]): { day: string; completed: number; total: number }[] => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const data = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayName = days[date.getDay()];
    
    // For now, return mock data - in production, filter tasks by date
    const dayTasks = tasks; // Would filter by date in production
    const completed = dayTasks.filter(t => t.isCompleted).length;
    
    data.push({
      day: dayName,
      completed: i === 0 ? completed : Math.floor(Math.random() * dayTasks.length),
      total: dayTasks.length,
    });
  }

  return data;
};
