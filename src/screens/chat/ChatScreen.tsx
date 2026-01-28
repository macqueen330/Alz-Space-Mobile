import React, { useState, useEffect, useRef } from 'react';
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
import { Send, Mic, MicOff, Volume2, VolumeX } from 'lucide-react-native';

import { supabase } from '../../services/supabaseClient';
import { getChatHistory, saveMessage } from '../../services/chatService';
import { sendMessageToGemini } from '../../services/geminiService';
import { VoiceService } from '../../platform/voice';
import { SpeechService } from '../../platform/speech';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import type { ChatMessage } from '../../types';

export function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadChatHistory();
    initializeVoice();

    return () => {
      VoiceService.destroy();
      SpeechService.stop();
    };
  }, []);

  const loadChatHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);
      const history = await getChatHistory(user.id);
      setMessages(history);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const initializeVoice = async () => {
    try {
      await VoiceService.initialize();
      VoiceService.setCallback((state) => {
        if (state.isListening !== undefined) {
          setIsListening(state.isListening);
        }
        if (state.results && state.results.length > 0) {
          const transcript = state.results[0];
          setInputText(prev => prev + transcript);
        }
        if (state.error) {
          console.error('Voice error:', state.error);
        }
      });
    } catch (error) {
      console.error('Error initializing voice:', error);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !userId) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Save user message
      await saveMessage(userId, userMessage.text, 'user');

      // Get AI response
      const aiResponse = await sendMessageToGemini(userMessage.text);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      await saveMessage(userId, aiResponse, 'ai');

      // Speak the response
      handleSpeak(aiResponse);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
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
    const isUser = message.sender === 'user';

    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.aiBubble,
        ]}
      >
        <Text style={[styles.messageText, isUser && styles.userMessageText]}>
          {message.text}
        </Text>
        {!isUser && (
          <TouchableOpacity
            style={styles.speakButton}
            onPress={() => handleSpeak(message.text)}
          >
            {isSpeaking ? (
              <VolumeX size={16} color={Colors.primary} />
            ) : (
              <Volume2 size={16} color={Colors.primary} />
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
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
              <Text style={styles.emptySubtext}>
                I'm here to help with care advice and support.
              </Text>
            </View>
          }
        />

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
            onPress={handleVoiceToggle}
          >
            {isListening ? (
              <MicOff size={24} color={Colors.bgWhite} />
            ) : (
              <Mic size={24} color={Colors.primary} />
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Send size={24} color={inputText.trim() ? Colors.bgWhite : Colors.gray400} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgSoft,
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    padding: Layout.spacing.md,
    paddingBottom: Layout.spacing.lg,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
    marginBottom: Layout.spacing.sm,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.bgWhite,
  },
  messageText: {
    fontSize: Layout.fontSize.md,
    color: Colors.textMain,
    lineHeight: 22,
  },
  userMessageText: {
    color: Colors.bgWhite,
  },
  speakButton: {
    alignSelf: 'flex-end',
    marginTop: Layout.spacing.xs,
    padding: Layout.spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    color: Colors.textMain,
  },
  emptySubtext: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.xs,
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.sm,
  },
  loadingText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Layout.spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Layout.spacing.md,
    backgroundColor: Colors.bgWhite,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.sm,
  },
  voiceButtonActive: {
    backgroundColor: Colors.error,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.gray100,
    borderRadius: Layout.borderRadius.lg,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    fontSize: Layout.fontSize.md,
    color: Colors.textMain,
    maxHeight: 100,
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Layout.spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.gray200,
  },
});
