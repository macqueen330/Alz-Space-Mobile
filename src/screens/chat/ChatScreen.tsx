import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Mic, MicOff, Volume2, VolumeX, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { VoiceService } from '../../platform/voice';
import { SpeechService } from '../../platform/speech';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import { useChat } from '../../hooks/useChat';
import type { ChatMessage } from '../../types';

export function ChatScreen() {
  const {
    messages, inputText, setInputText, isLoading,
    sendMessage, clearMessages, flatListRef,
  } = useChat();

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await VoiceService.initialize();
        VoiceService.setCallback((state) => {
          if (state.isListening !== undefined) setIsListening(state.isListening);
          if (state.results && state.results.length > 0) {
            setInputText((prev) => prev + state.results![0]);
          }
        });
      } catch (error) {
        console.error('Error initializing voice:', error);
      }
    };
    init();
    return () => {
      VoiceService.destroy();
      SpeechService.stop();
    };
  }, [setInputText]);

  const handleSend = async () => {
    const aiResponse = await sendMessage();
    if (aiResponse && isAudioEnabled) {
      handleSpeak(aiResponse);
    }
  };

  const handleVoiceToggle = async () => {
    if (isListening) {
      await VoiceService.stopListening();
    } else {
      await VoiceService.startListening('en-US');
    }
  };

  const handleSpeak = async (text: string) => {
    if (isSpeaking) {
      await SpeechService.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      await SpeechService.speak(text, {
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  const renderMessage = ({ item: message }: { item: ChatMessage }) => {
    if (message.sender === 'user') {
      return (
        <LinearGradient
          colors={[Colors.primary, '#FF6B00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.messageBubble, styles.userBubble]}
        >
          <Text style={[styles.messageText, styles.userMessageText]}>{message.text}</Text>
        </LinearGradient>
      );
    }

    return (
      <View style={[styles.messageBubble, styles.aiBubble]}>
        <Text style={styles.messageText}>{message.text}</Text>
        <TouchableOpacity style={styles.speakButton} onPress={() => handleSpeak(message.text)}>
          {isSpeaking ? (
            <VolumeX size={16} color={Colors.primary} />
          ) : (
            <Volume2 size={16} color={Colors.primary} />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.gradientTop} />

      <View style={styles.headerControls}>
        <TouchableOpacity
          style={[styles.headerButton, isAudioEnabled ? styles.headerButtonActive : styles.headerButtonInactive]}
          onPress={() => setIsAudioEnabled((prev) => !prev)}
        >
          {isAudioEnabled ? <Volume2 size={18} color={Colors.primary} /> : <VolumeX size={18} color={Colors.gray400} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton} onPress={clearMessages}>
          <Trash2 size={18} color={Colors.gray400} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Start a conversation!</Text>
              <Text style={styles.emptySubtext}>I'm here to help with care advice and support.</Text>
            </View>
          }
        />

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
            onPress={handleVoiceToggle}
          >
            {isListening ? <MicOff size={24} color={Colors.bgWhite} /> : <Mic size={24} color={Colors.primary} />}
          </TouchableOpacity>

          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity onPress={handleSend} disabled={!inputText.trim() || isLoading} activeOpacity={0.9}>
              {inputText.trim() ? (
                <LinearGradient colors={[Colors.primary, '#FF6B00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.sendButton}>
                  <Send size={22} color={Colors.bgWhite} />
                </LinearGradient>
              ) : (
                <View style={[styles.sendButton, styles.sendButtonDisabled]}>
                  <Send size={22} color={Colors.gray400} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgSoft },
  gradientTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 128,
    backgroundColor: Colors.secondary, opacity: 0.15,
  },
  headerControls: {
    position: 'absolute', top: 80, right: 16, flexDirection: 'row', gap: 8, zIndex: 20,
  },
  headerButton: {
    padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: Colors.shadowColor, shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  headerButtonActive: { backgroundColor: 'rgba(255,255,255,0.9)' },
  headerButtonInactive: { backgroundColor: 'rgba(255,255,255,0.5)' },
  keyboardView: { flex: 1 },
  messagesList: { padding: Layout.spacing.lg, paddingTop: 96, paddingBottom: Layout.spacing.lg },
  messageBubble: {
    maxWidth: '85%', padding: Layout.spacing.md, borderRadius: Layout.borderRadius.lg,
    marginBottom: Layout.spacing.sm, shadowColor: Colors.shadowColor,
    shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  userBubble: { alignSelf: 'flex-end', borderTopRightRadius: 6 },
  aiBubble: {
    alignSelf: 'flex-start', backgroundColor: Colors.bgWhite, borderTopLeftRadius: 6,
    borderWidth: 1, borderColor: Colors.gray100,
  },
  messageText: { fontSize: Layout.fontSize.md, color: Colors.textMain, lineHeight: 22 },
  userMessageText: { color: Colors.bgWhite },
  speakButton: { alignSelf: 'flex-end', marginTop: Layout.spacing.xs, padding: Layout.spacing.xs },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { fontSize: Layout.fontSize.lg, fontWeight: '600', color: Colors.textMain },
  emptySubtext: { fontSize: Layout.fontSize.md, color: Colors.textSecondary, marginTop: Layout.spacing.xs, textAlign: 'center' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Layout.spacing.sm },
  loadingText: { fontSize: Layout.fontSize.sm, color: Colors.textSecondary, marginLeft: Layout.spacing.sm },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', padding: Layout.spacing.md,
    backgroundColor: Colors.bgWhite, borderTopWidth: 1, borderTopColor: Colors.gray200, paddingBottom: 24,
  },
  voiceButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.gray100,
    justifyContent: 'center', alignItems: 'center', marginRight: Layout.spacing.sm,
  },
  voiceButtonActive: {
    backgroundColor: Colors.error, shadowColor: '#FCA5A5',
    shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
  },
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.gray50,
    borderRadius: 999, paddingVertical: 6, paddingHorizontal: 8, borderWidth: 1, borderColor: Colors.gray200,
  },
  input: {
    flex: 1, backgroundColor: 'transparent', paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm, fontSize: Layout.fontSize.md, color: Colors.textMain,
    maxHeight: 100, minHeight: 44,
  },
  sendButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: Colors.gray200 },
});
