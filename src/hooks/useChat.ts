import { useState, useEffect, useRef } from 'react';
import type { FlatList } from 'react-native';
import { supabase } from '../services/supabaseClient';
import { getChatHistory, saveMessage } from '../services/chatService';
import { sendMessageToGemini } from '../services/geminiService';
import type { ChatMessage } from '../types';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const load = async () => {
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
    load();
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim() || !userId) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      await saveMessage(userId, userMessage.text, 'user');
      const aiResponse = await sendMessageToGemini(userMessage.text);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      await saveMessage(userId, aiResponse, 'ai');
      return aiResponse;
    } catch (error) {
      console.error('Error sending message:', error);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => setMessages([]);

  return {
    messages,
    inputText,
    setInputText,
    isLoading,
    sendMessage,
    clearMessages,
    flatListRef,
  };
}
