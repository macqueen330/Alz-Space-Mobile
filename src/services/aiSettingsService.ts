import { supabase } from './supabaseClient';
import type { PatientAISettings, FAQ } from '../types';
import type { PatientAISettingsDB } from '../types/database.types';

// Convert database row to frontend type
const toAISettings = (row: PatientAISettingsDB): PatientAISettings => ({
    voiceGender: row.voice_gender,
    aiBio: row.ai_bio,
    preferredTopics: row.preferred_topics as string[],
    commonQuestions: row.common_questions as FAQ[],
    chatStyle: row.chat_style || undefined,
    patientSelfDescription: row.patient_self_description || undefined
});

// Get AI settings for a patient by their profile ID
export const getAISettings = async (patientProfileId: string): Promise<PatientAISettings | null> => {
    if (!patientProfileId) return null;
    
    const { data, error } = await supabase
        .from('patient_ai_settings')
        .select('*')
        .eq('patient_profile_id', patientProfileId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return toAISettings(data);
};

// Create or update AI settings
export const saveAISettings = async (patientProfileId: string, settings: PatientAISettings): Promise<PatientAISettings> => {
    if (!patientProfileId) {
        throw new Error('Patient profile ID is required to save AI settings');
    }
    
    const existing = await getAISettings(patientProfileId);

    if (existing) {
        const { data, error } = await (supabase
            .from('patient_ai_settings') as any)
            .update({
                voice_gender: settings.voiceGender,
                ai_bio: settings.aiBio,
                preferred_topics: settings.preferredTopics,
                common_questions: settings.commonQuestions,
                chat_style: settings.chatStyle,
                patient_self_description: settings.patientSelfDescription
            })
            .eq('patient_profile_id', patientProfileId)
            .select()
            .single();

        if (error) throw error;
        return toAISettings(data);
    } else {
        const { data, error } = await (supabase
            .from('patient_ai_settings') as any)
            .insert({
                patient_profile_id: patientProfileId,
                voice_gender: settings.voiceGender,
                ai_bio: settings.aiBio,
                preferred_topics: settings.preferredTopics,
                common_questions: settings.commonQuestions,
                chat_style: settings.chatStyle,
                patient_self_description: settings.patientSelfDescription
            })
            .select()
            .single();

        if (error) throw error;
        return toAISettings(data);
    }
};

// Create default AI settings for a new patient
export const createDefaultAISettings = async (patientProfileId: string): Promise<PatientAISettings> => {
    const defaultSettings: PatientAISettings = {
        voiceGender: 'Female',
        aiBio: 'I am a compassionate AI assistant here to help with daily activities and provide support.',
        preferredTopics: ['Family', 'Music', 'Weather', 'Daily Activities'],
        commonQuestions: [
            { id: '1', question: 'Where are we?', answer: 'You are at home, safe and sound.' },
            { id: '2', question: 'What time is it?', answer: 'Let me check... I will tell you the current time.' },
            { id: '3', question: 'Who are you?', answer: 'I am your friendly AI assistant, here to help you.' }
        ],
        chatStyle: 'Warm and encouraging',
        patientSelfDescription: ''
    };

    return saveAISettings(patientProfileId, defaultSettings);
};
