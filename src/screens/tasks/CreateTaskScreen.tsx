import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import {
  Clock,
  Calendar,
  Zap,
  Plus,
  X,
  ChevronLeft,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../../services/supabaseClient';
import { createTask, updateTask } from '../../services/taskService';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import type { Task, TaskAsset, TaskType, RootStackParamList } from '../../types';

type RouteProps = RouteProp<RootStackParamList, 'CreateTask'>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

const repeatOptions = ['Daily', 'Weekly', 'Customize'];
const dayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CreateTaskScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const existingTask = route.params?.task;

  const [title, setTitle] = useState(existingTask?.title || '');
  const [startTime, setStartTime] = useState(existingTask?.startTime || '09:00');
  const [endTime, setEndTime] = useState(existingTask?.endTime || '10:00');
  const [repeat, setRepeat] = useState(existingTask?.repeat || 'Daily');
  const [customDays, setCustomDays] = useState<string[]>(existingTask?.customDays || []);
  const [automationEnabled, setAutomationEnabled] = useState(existingTask?.automationEnabled || false);
  const [voiceReminder, setVoiceReminder] = useState(existingTask?.voiceReminder ?? true);
  const [assets, setAssets] = useState<TaskAsset[]>(existingTask?.assets || []);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!existingTask;

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    if (repeat === 'Customize' && customDays.length === 0) {
      Alert.alert('Error', 'Please select at least one custom day');
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const taskData: Omit<Task, 'id'> = {
        title: title.trim(),
        startTime,
        endTime,
        repeat,
        customDays: repeat === 'Customize' ? customDays : undefined,
        isCompleted: existingTask?.isCompleted || false,
        automationEnabled,
        voiceReminder,
        assets,
        assignedTo: user.id,
      };

      if (isEditing) {
        await updateTask(existingTask.id, taskData);
        Alert.alert('Success', 'Task updated successfully');
      } else {
        await createTask(user.id, taskData);
        Alert.alert('Success', 'Task created successfully');
      }

      navigation.navigate('TaskList');
    } catch (error: unknown) {
      Alert.alert('Error', error.message || 'Failed to save task');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDay = (day: string) => {
    setCustomDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const addAsset = () => {
    const newAsset: TaskAsset = {
      id: Date.now().toString(),
      type: 'GAME' as TaskType,
      title: 'New Activity',
      duration: 15,
    };
    setAssets(prev => [...prev, newAsset]);
  };

  const removeAsset = (assetId: string) => {
    setAssets(prev => prev.filter(a => a.id !== assetId));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Background decorations (standardized) */}
          <View style={styles.gradientTop} />
          <View style={styles.blobTopRight} />

        {/* Header with back button */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={Colors.gray700} />
          </TouchableOpacity>
          <View style={styles.headerTitlePill}>
            <Text style={styles.headerTitle}>
              {isEditing ? 'Refine Plan' : 'New Plan'}
            </Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Task Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter task title"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        {/* Time */}
        <View style={styles.section}>
          <Text style={styles.label}>Time</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeInput}>
              <Clock size={16} color={Colors.primary} />
              <TextInput
                style={styles.timeText}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="09:00"
              />
            </View>
            <Text style={styles.timeSeparator}>to</Text>
            <View style={styles.timeInput}>
              <Clock size={16} color={Colors.primary} />
              <TextInput
                style={styles.timeText}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="10:00"
              />
            </View>
          </View>
        </View>

        {/* Repeat */}
        <View style={styles.section}>
          <Text style={styles.label}>Repeat</Text>
          <View style={styles.repeatOptions}>
            {repeatOptions.map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.repeatOption,
                  repeat === option && styles.repeatOptionActive,
                ]}
                onPress={() => setRepeat(option)}
              >
                <Text
                  style={[
                    styles.repeatOptionText,
                    repeat === option && styles.repeatOptionTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {repeat === 'Customize' && (
            <View style={styles.daysRow}>
              {dayOptions.map(day => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayOption,
                    customDays.includes(day) && styles.dayOptionActive,
                  ]}
                  onPress={() => toggleDay(day)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      customDays.includes(day) && styles.dayTextActive,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Activities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Activities</Text>
            <TouchableOpacity style={styles.addActivityButton} onPress={addAsset}>
              <Plus size={16} color={Colors.primary} />
              <Text style={styles.addActivityText}>Add</Text>
            </TouchableOpacity>
          </View>

          {assets.map(asset => (
            <View key={asset.id} style={styles.assetCard}>
              <View style={styles.assetInfo}>
                <Text style={styles.assetTitle}>{asset.title}</Text>
                <Text style={styles.assetMeta}>
                  {asset.type} • {asset.duration} min
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeAsset(asset.id)}>
                <X size={20} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ))}

          {assets.length === 0 && (
            <Text style={styles.noAssetsText}>No activities added yet</Text>
          )}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.label}>Settings</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Zap size={20} color={Colors.secondary} />
              <Text style={styles.settingText}>Auto Set Mode</Text>
            </View>
            <Switch
              value={automationEnabled}
              onValueChange={setAutomationEnabled}
              trackColor={{ false: Colors.gray300, true: Colors.primary + '70' }}
              thumbColor={automationEnabled ? Colors.primary : Colors.gray100}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Calendar size={20} color={Colors.primary} />
              <Text style={styles.settingText}>Voice Reminder</Text>
            </View>
            <Switch
              value={voiceReminder}
              onValueChange={setVoiceReminder}
              trackColor={{ false: Colors.gray300, true: Colors.primary + '70' }}
              thumbColor={voiceReminder ? Colors.primary : Colors.gray100}
            />
          </View>
        </View>
      </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : isEditing ? 'Update Task' : 'Create Task'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgWhite,
  },
  flex: {
    flex: 1,
  },

  // ============ Background Decorations ============
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 256,
    backgroundColor: Colors.secondary,
    opacity: 0.15,
  },
  blobTopRight: {
    position: 'absolute',
    top: 0,
    right: -50,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: Colors.secondary,
    opacity: 0.1,
  },

  // ============ Header ============
  headerRow: {
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Layout.spacing.lg,
    paddingTop: 0,
    paddingBottom: 120,
  },
  section: {
    backgroundColor: Colors.bgWhite,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
  },
  label: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.textMain,
    marginBottom: Layout.spacing.sm,
  },
  input: {
    backgroundColor: Colors.gray100,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    fontSize: Layout.fontSize.md,
    color: Colors.textMain,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
  },
  timeText: {
    flex: 1,
    fontSize: Layout.fontSize.md,
    color: Colors.textMain,
    marginLeft: Layout.spacing.sm,
  },
  timeSeparator: {
    marginHorizontal: Layout.spacing.md,
    color: Colors.textSecondary,
  },
  repeatOptions: {
    flexDirection: 'row',
  },
  repeatOption: {
    flex: 1,
    paddingVertical: Layout.spacing.sm,
    alignItems: 'center',
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.gray100,
    marginHorizontal: Layout.spacing.xs,
  },
  repeatOptionActive: {
    backgroundColor: Colors.primary,
  },
  repeatOptionText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  repeatOptionTextActive: {
    color: Colors.bgWhite,
  },
  daysRow: {
    flexDirection: 'row',
    marginTop: Layout.spacing.md,
    flexWrap: 'wrap',
  },
  dayOption: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.sm,
    backgroundColor: Colors.gray100,
    marginRight: Layout.spacing.xs,
    marginBottom: Layout.spacing.xs,
  },
  dayOptionActive: {
    backgroundColor: Colors.primary,
  },
  dayText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  dayTextActive: {
    color: Colors.bgWhite,
  },
  addActivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addActivityText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.primary,
    marginLeft: Layout.spacing.xs,
  },
  assetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  assetInfo: {
    flex: 1,
  },
  assetTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '500',
    color: Colors.textMain,
  },
  assetMeta: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  noAssetsText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Layout.spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: Layout.fontSize.md,
    color: Colors.textMain,
    marginLeft: Layout.spacing.md,
  },
  footer: {
    padding: Layout.spacing.lg,
    paddingBottom: 32,
    backgroundColor: Colors.bgWhite,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    shadowColor: '#FDBA74',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: Colors.bgWhite,
    fontSize: 16,
    fontWeight: '700',
  },
});
