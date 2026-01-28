import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import {
  getTasks,
  createTask as createTaskService,
  updateTask as updateTaskService,
  deleteTask as deleteTaskService,
  toggleTaskCompletion,
} from '../services/taskService';
import type { Task } from '../types';

interface UseTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createTask: (task: Omit<Task, 'id'>, patientProfileId?: string) => Promise<Task>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleComplete: (taskId: string, isCompleted: boolean) => Promise<void>;
}

export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTasks([]);
        return;
      }

      const userTasks = await getTasks(user.id);
      setTasks(userTasks);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const createTask = async (task: Omit<Task, 'id'>, patientProfileId?: string): Promise<Task> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const newTask = await createTaskService(user.id, task, patientProfileId);
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task> => {
    const updatedTask = await updateTaskService(taskId, updates);
    setTasks(prev => prev.map(t => (t.id === taskId ? updatedTask : t)));
    return updatedTask;
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    await deleteTaskService(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const toggleComplete = async (taskId: string, isCompleted: boolean): Promise<void> => {
    await toggleTaskCompletion(taskId, !isCompleted);
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, isCompleted: !isCompleted } : t))
    );
  };

  return {
    tasks,
    isLoading,
    error,
    refresh: loadTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
  };
}
