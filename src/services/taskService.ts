import { supabase } from './supabaseClient';
import type { Task, TaskType, TaskAsset } from '../types';
import type { TaskDB, TaskAssetDB } from '../types/database.types';

// Convert database row to frontend type
const toTask = (row: TaskDB, taskAssets: TaskAssetDB[] = []): Task => ({
    id: row.id,
    title: row.title,
    patientProfileId: row.patient_profile_id || undefined,
    startTime: row.start_time || '',
    endTime: row.end_time || '',
    repeat: row.repeat,
    customDays: row.custom_days as string[],
    isCompleted: row.is_completed,
    automationEnabled: row.automation_enabled,
    autoDuration: row.auto_duration || undefined,
    assetWeights: row.asset_weights as any,
    assignedTo: row.assigned_to,
    voiceReminder: row.voice_reminder,
    assets: taskAssets.map(ta => ({
        id: ta.id,
        type: ta.type as TaskType,
        title: ta.title,
        duration: ta.duration
    }))
});

// Get all tasks for current user
export const getTasks = async (userId: string): Promise<Task[]> => {
    const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: true });

    if (tasksError) throw tasksError;
    if (!tasks || tasks.length === 0) return [];

    const taskRows = tasks as TaskDB[];
    const taskIds = taskRows.map(t => t.id);
    const { data: taskAssets, error: assetsError } = await supabase
        .from('task_assets')
        .select('*')
        .in('task_id', taskIds);

    if (assetsError) throw assetsError;

    const assetRows = (taskAssets || []) as TaskAssetDB[];
    const assetsByTaskId: Record<string, TaskAssetDB[]> = {};
    assetRows.forEach(ta => {
        if (!assetsByTaskId[ta.task_id]) assetsByTaskId[ta.task_id] = [];
        assetsByTaskId[ta.task_id].push(ta);
    });

    return taskRows.map(t => toTask(t, assetsByTaskId[t.id] || []));
};

// Get tasks for a specific patient
export const getTasksForPatient = async (patientProfileId: string): Promise<Task[]> => {
    if (!patientProfileId) return [];
    
    const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('patient_profile_id', patientProfileId)
        .order('start_time', { ascending: true });

    if (tasksError) throw tasksError;
    if (!tasks || tasks.length === 0) return [];

    const taskRows = tasks as TaskDB[];
    const taskIds = taskRows.map(t => t.id);
    const { data: taskAssets, error: assetsError } = await supabase
        .from('task_assets')
        .select('*')
        .in('task_id', taskIds);

    if (assetsError) throw assetsError;

    const assetRows = (taskAssets || []) as TaskAssetDB[];
    const assetsByTaskId: Record<string, TaskAssetDB[]> = {};
    assetRows.forEach(ta => {
        if (!assetsByTaskId[ta.task_id]) assetsByTaskId[ta.task_id] = [];
        assetsByTaskId[ta.task_id].push(ta);
    });

    return taskRows.map(t => toTask(t, assetsByTaskId[t.id] || []));
};

// Create a new task
export const createTask = async (userId: string, task: Omit<Task, 'id'>, patientProfileId?: string): Promise<Task> => {
    const { data: newTask, error: taskError } = await (supabase
        .from('tasks') as any)
        .insert({
            user_id: userId,
            patient_profile_id: patientProfileId || task.patientProfileId || null,
            title: task.title,
            start_time: task.startTime || null,
            end_time: task.endTime || null,
            repeat: task.repeat,
            custom_days: task.customDays || [],
            is_completed: task.isCompleted,
            automation_enabled: task.automationEnabled,
            auto_duration: task.autoDuration,
            asset_weights: task.assetWeights,
            assigned_to: task.assignedTo,
            voice_reminder: task.voiceReminder
        })
        .select()
        .single();

    if (taskError) throw taskError;

    let taskAssets: TaskAssetDB[] = [];
    if (task.assets && task.assets.length > 0) {
        const { data: assets, error: assetsError } = await (supabase
            .from('task_assets') as any)
            .insert(
                task.assets.map(a => ({
                    task_id: newTask.id,
                    type: a.type,
                    title: a.title,
                    duration: a.duration
                }))
            )
            .select();

        if (assetsError) throw assetsError;
        taskAssets = assets || [];
    }

    return toTask(newTask as TaskDB, taskAssets);
};

// Update a task
export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task> => {
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.patientProfileId !== undefined) dbUpdates.patient_profile_id = updates.patientProfileId || null;
    if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime || null;
    if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime || null;
    if (updates.repeat !== undefined) dbUpdates.repeat = updates.repeat;
    if (updates.customDays !== undefined) dbUpdates.custom_days = updates.customDays;
    if (updates.isCompleted !== undefined) dbUpdates.is_completed = updates.isCompleted;
    if (updates.automationEnabled !== undefined) dbUpdates.automation_enabled = updates.automationEnabled;
    if (updates.autoDuration !== undefined) dbUpdates.auto_duration = updates.autoDuration;
    if (updates.assetWeights !== undefined) dbUpdates.asset_weights = updates.assetWeights;
    if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;
    if (updates.voiceReminder !== undefined) dbUpdates.voice_reminder = updates.voiceReminder;

    const { data: updatedTask, error: taskError } = await (supabase
        .from('tasks') as any)
        .update(dbUpdates)
        .eq('id', taskId)
        .select()
        .single();

    if (taskError) throw taskError;

    let taskAssets: TaskAssetDB[] = [];
    if (updates.assets !== undefined) {
        await supabase.from('task_assets').delete().eq('task_id', taskId);

        if (updates.assets.length > 0) {
            const { data: assets, error: assetsError } = await (supabase
                .from('task_assets') as any)
                .insert(
                    updates.assets.map(a => ({
                        task_id: taskId,
                        type: a.type,
                        title: a.title,
                        duration: a.duration
                    }))
                )
                .select();

            if (assetsError) throw assetsError;
            taskAssets = assets || [];
        }
    } else {
        const { data: assets } = await supabase
            .from('task_assets')
            .select('*')
            .eq('task_id', taskId);
        taskAssets = (assets || []) as TaskAssetDB[];
    }

    return toTask(updatedTask as TaskDB, taskAssets);
};

// Delete a task
export const deleteTask = async (taskId: string): Promise<void> => {
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

    if (error) throw error;
};

// Toggle task completion
export const toggleTaskCompletion = async (taskId: string, isCompleted: boolean): Promise<void> => {
    const { error } = await (supabase
        .from('tasks') as any)
        .update({ is_completed: isCompleted })
        .eq('id', taskId);

    if (error) throw error;
};

// Toggle automation
export const toggleAutomation = async (taskId: string, enabled: boolean): Promise<void> => {
    const { error } = await (supabase
        .from('tasks') as any)
        .update({ automation_enabled: enabled })
        .eq('id', taskId);

    if (error) throw error;
};
