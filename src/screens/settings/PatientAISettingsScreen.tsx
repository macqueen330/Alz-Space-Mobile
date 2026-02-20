import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Volume2, Plus, X, Save, ChevronLeft } from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../../services/supabaseClient';
import { getAISettings, saveAISettings } from '../../services/aiSettingsService';
import { getFamilyMembers } from '../../services/familyService';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import type { PatientAISettings, FAQ, FamilyMember } from '../../types';

const defaultSettings: PatientAISettings = {
  voiceGender: 'Female',
  aiBio: '',
  preferredTopics: [],
  commonQuestions: [],
  chatStyle: 'Warm and encouraging',
  patientSelfDescription: '',
};

const topicOptions = [
  'Family',
  'Music',
  'Weather',
  'Daily Activities',
  'Food',
  'Nature',
  'Sports',
  'History',
  'Pets',
  'Travel',
];

export function PatientAISettingsScreen() {
  const [settings, setSettings] = useState<PatientAISettings>(defaultSettings);
  const [patients, setPatients] = useState<FamilyMember[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    if (selectedPatientId) {
      loadPatientSettings(selectedPatientId);
    }
  }, [selectedPatientId]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const members = await getFamilyMembers(user.id);
      const patientMembers = members.filter(m => m.role === 'PATIENT' && m.linkedProfileId);
      setPatients(patientMembers);

      if (patientMembers.length > 0 && patientMembers[0].linkedProfileId) {
        setSelectedPatientId(patientMembers[0].linkedProfileId);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadPatientSettings = async (patientProfileId: string) => {
    try {
      const patientSettings = await getAISettings(patientProfileId);
      if (patientSettings) {
        setSettings(patientSettings);
      } else {
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedPatientId) {
      Alert.alert('Error', 'No patient selected');
      return;
    }

    setIsSaving(true);
    try {
      await saveAISettings(selectedPatientId, settings);
      Alert.alert('Success', 'AI settings saved successfully');
    } catch (error: unknown) {
      Alert.alert('Error', error.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTopic = (topic: string) => {
    setSettings(prev => ({
      ...prev,
      preferredTopics: prev.preferredTopics.includes(topic)
        ? prev.preferredTopics.filter(t => t !== topic)
        : [...prev.preferredTopics, topic],
    }));
  };

  const addQuestion = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      Alert.alert('Error', 'Please enter both question and answer');
      return;
    }

    const newFAQ: FAQ = {
      id: Date.now().toString(),
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
    };

    setSettings(prev => ({
      ...prev,
      commonQuestions: [...prev.commonQuestions, newFAQ],
    }));

    setNewQuestion('');
    setNewAnswer('');
  };

  const removeQuestion = (id: string) => {
    setSettings(prev => ({
      ...prev,
      commonQuestions: prev.commonQuestions.filter(q => q.id !== id),
    }));
  };

  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <View style={styles.gradientTop} />

      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color={Colors.gray700} />
        </TouchableOpacity>
        <View style={styles.headerTitlePill}>
          <Text style={styles.headerTitle}>Patient AI Settings</Text>
        </View>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Patient Selection */}
        {patients.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.label}>Select Patient</Text>
            <View style={styles.patientRow}>
              {patients.map(patient => (
                <TouchableOpacity
                  key={patient.id}
                  style={[
                    styles.patientChip,
                    patient.linkedProfileId === selectedPatientId && styles.patientChipActive,
                  ]}
                  onPress={() => patient.linkedProfileId && setSelectedPatientId(patient.linkedProfileId)}
                >
                  <Text
                    style={[
                      styles.patientChipText,
                      patient.linkedProfileId === selectedPatientId && styles.patientChipTextActive,
                    ]}
                  >
                    {patient.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Voice Gender */}
        <View style={styles.section}>
          <Text style={styles.label}>AI Voice</Text>
          <View style={styles.voiceRow}>
            {(['Female', 'Male'] as const).map(gender => (
              <TouchableOpacity
                key={gender}
                style={[
                  styles.voiceOption,
                  settings.voiceGender === gender && styles.voiceOptionActive,
                ]}
                onPress={() => setSettings(prev => ({ ...prev, voiceGender: gender }))}
              >
                <Volume2
                  size={20}
                  color={settings.voiceGender === gender ? Colors.bgWhite : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.voiceText,
                    settings.voiceGender === gender && styles.voiceTextActive,
                  ]}
                >
                  {gender}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* AI Bio */}
        <View style={styles.section}>
          <Text style={styles.label}>AI Personality Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={settings.aiBio}
            onChangeText={text => setSettings(prev => ({ ...prev, aiBio: text }))}
            placeholder="Describe the AI assistant's personality..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Preferred Topics */}
        <View style={styles.section}>
          <Text style={styles.label}>Preferred Topics</Text>
          <View style={styles.topicsGrid}>
            {topicOptions.map(topic => (
              <TouchableOpacity
                key={topic}
                style={[
                  styles.topicChip,
                  settings.preferredTopics.includes(topic) && styles.topicChipActive,
                ]}
                onPress={() => toggleTopic(topic)}
              >
                <Text
                  style={[
                    styles.topicText,
                    settings.preferredTopics.includes(topic) && styles.topicTextActive,
                  ]}
                >
                  {topic}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Common Q&A */}
        <View style={styles.section}>
          <Text style={styles.label}>Common Questions & Answers</Text>
          
          {settings.commonQuestions.map(faq => (
            <View key={faq.id} style={styles.faqCard}>
              <View style={styles.faqContent}>
                <Text style={styles.faqQuestion}>Q: {faq.question}</Text>
                <Text style={styles.faqAnswer}>A: {faq.answer}</Text>
              </View>
              <TouchableOpacity onPress={() => removeQuestion(faq.id)}>
                <X size={20} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.addFaqSection}>
            <TextInput
              style={styles.input}
              value={newQuestion}
              onChangeText={setNewQuestion}
              placeholder="Enter question..."
              placeholderTextColor={Colors.textMuted}
            />
            <TextInput
              style={[styles.input, { marginTop: Layout.spacing.sm }]}
              value={newAnswer}
              onChangeText={setNewAnswer}
              placeholder="Enter answer..."
              placeholderTextColor={Colors.textMuted}
            />
            <TouchableOpacity style={styles.addButton} onPress={addQuestion}>
              <Plus size={20} color={Colors.primary} />
              <Text style={styles.addButtonText}>Add Q&A</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Patient Self Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Patient Self-Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={settings.patientSelfDescription}
            onChangeText={text => setSettings(prev => ({ ...prev, patientSelfDescription: text }))}
            placeholder="How should the AI refer to the patient? (e.g., 'You are Eleanor, a retired teacher who loves gardening')"
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Save size={20} color={Colors.bgWhite} />
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save Settings'}
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
  flex: { flex: 1 },

  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 128,
    backgroundColor: '#DCFCE7',
    opacity: 0.6,
  },

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
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  patientRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  patientChip: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.gray100,
    marginRight: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
  },
  patientChipActive: {
    backgroundColor: Colors.primary,
  },
  patientChipText: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
  },
  patientChipTextActive: {
    color: Colors.bgWhite,
  },
  voiceRow: {
    flexDirection: 'row',
  },
  voiceOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.gray100,
    borderRadius: Layout.borderRadius.md,
    marginHorizontal: Layout.spacing.xs,
  },
  voiceOptionActive: {
    backgroundColor: Colors.primary,
  },
  voiceText: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    marginLeft: Layout.spacing.sm,
  },
  voiceTextActive: {
    color: Colors.bgWhite,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  topicChip: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.gray100,
    marginRight: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
  },
  topicChipActive: {
    backgroundColor: Colors.primary,
  },
  topicText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },
  topicTextActive: {
    color: Colors.bgWhite,
  },
  faqCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.gray100,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  faqContent: {
    flex: 1,
  },
  faqQuestion: {
    fontSize: Layout.fontSize.md,
    fontWeight: '500',
    color: Colors.textMain,
  },
  faqAnswer: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.xs,
  },
  addFaqSection: {
    marginTop: Layout.spacing.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.md,
    marginTop: Layout.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Layout.borderRadius.md,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: Layout.fontSize.md,
    color: Colors.primary,
    marginLeft: Layout.spacing.sm,
  },
  footer: {
    padding: Layout.spacing.md,
    backgroundColor: Colors.bgWhite,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: Colors.bgWhite,
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    marginLeft: Layout.spacing.sm,
  },
});
