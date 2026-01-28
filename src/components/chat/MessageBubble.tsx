import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Volume2 } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import type { ChatMessage } from '../../types';

interface MessageBubbleProps {
  message: ChatMessage;
  onSpeak?: () => void;
}

export function MessageBubble({ message, onSpeak }: MessageBubbleProps) {
  const isUser = message.sender === 'user';

  return (
    <View
      style={[styles.container, isUser ? styles.userContainer : styles.aiContainer]}
    >
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.text, isUser && styles.userText]}>
          {message.text}
        </Text>
        
        {!isUser && onSpeak && (
          <TouchableOpacity style={styles.speakButton} onPress={onSpeak}>
            <Volume2 size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={[styles.timestamp, isUser && styles.userTimestamp]}>
        {message.timestamp.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.sm,
    maxWidth: '80%',
  },
  userContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  aiContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.lg,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: Layout.borderRadius.xs,
  },
  aiBubble: {
    backgroundColor: Colors.bgWhite,
    borderBottomLeftRadius: Layout.borderRadius.xs,
  },
  text: {
    fontSize: Layout.fontSize.md,
    color: Colors.textMain,
    lineHeight: 22,
  },
  userText: {
    color: Colors.bgWhite,
  },
  speakButton: {
    alignSelf: 'flex-end',
    marginTop: Layout.spacing.xs,
    padding: Layout.spacing.xs,
  },
  timestamp: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textMuted,
    marginTop: Layout.spacing.xs,
  },
  userTimestamp: {
    textAlign: 'right',
  },
});
