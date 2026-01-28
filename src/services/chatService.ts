import { supabase } from './supabaseClient';
import type { ChatMessage } from '../types';
import type { ChatMessageDB } from '../types/database.types';

// Convert database row to frontend type
const toChatMessage = (row: ChatMessageDB): ChatMessage => ({
    id: row.id,
    text: row.message,
    sender: row.sender,
    timestamp: new Date(row.created_at)
});

// Get chat history for current user
export const getChatHistory = async (userId: string, limit: number = 50): Promise<ChatMessage[]> => {
    const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(limit);

    if (error) throw error;
    return (data || []).map(toChatMessage);
};

// Save a new chat message
export const saveMessage = async (userId: string, message: string, sender: 'user' | 'ai'): Promise<ChatMessage> => {
    const { data, error } = await supabase
        .from('chat_messages')
        .insert({
            user_id: userId,
            message: message,
            sender: sender
        })
        .select()
        .single();

    if (error) throw error;
    return toChatMessage(data);
};

// Clear chat history for user
export const clearChatHistory = async (userId: string): Promise<void> => {
    const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', userId);

    if (error) throw error;
};

// Subscribe to new messages (real-time)
export const subscribeToMessages = (userId: string, callback: (message: ChatMessage) => void) => {
    return supabase
        .channel('chat_messages')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `user_id=eq.${userId}`
            },
            (payload) => {
                callback(toChatMessage(payload.new as ChatMessageDB));
            }
        )
        .subscribe();
};
