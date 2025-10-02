import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  listing_id: string | null;
  last_message_at: string;
  created_at: string;
  other_user?: {
    id: string;
    full_name: string | null;
    email: string;
  };
  last_message?: {
    message_text: string;
    sender_id: string;
    created_at: string;
  };
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_text: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export const useMessaging = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          user1:profiles!conversations_user1_id_fkey(id, full_name, email),
          user2:profiles!conversations_user2_id_fkey(id, full_name, email)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        setConversations([]);
        return;
      }

      const conversationsWithOtherUser = await Promise.all(
        (data || []).map(async (conv: any) => {
          const otherUser = conv.user1_id === user.id ? conv.user2 : conv.user1;

          const { data: lastMessage } = await supabase
            .from('messages')
            .select('message_text, sender_id, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', user.id);

          return {
            ...conv,
            other_user: otherUser,
            last_message: lastMessage,
            unread_count: count || 0,
          };
        })
      );

      setConversations(conversationsWithOtherUser);

      const totalUnread = conversationsWithOtherUser.reduce(
        (sum, conv) => sum + (conv.unread_count || 0),
        0
      );
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error in fetchConversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
        return;
      }

      setMessages(data || []);

      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      await fetchConversations();
    } catch (error) {
      console.error('Error in fetchMessages:', error);
      setMessages([]);
    }
  }, [user, fetchConversations]);

  const getOrCreateConversation = useCallback(async (otherUserId: string, listingId?: string) => {
    if (!user) return null;

    try {
      const [smallerId, largerId] = [user.id, otherUserId].sort();

      const { data: existing, error: fetchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user1_id', smallerId)
        .eq('user2_id', largerId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching conversation:', fetchError);
        return null;
      }

      if (existing) {
        return existing.id;
      }

      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          user1_id: smallerId,
          user2_id: largerId,
          listing_id: listingId || null,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating conversation:', createError);
        return null;
      }

      await fetchConversations();
      return newConv.id;
    } catch (error) {
      console.error('Error in getOrCreateConversation:', error);
      return null;
    }
  }, [user, fetchConversations]);

  const sendMessage = useCallback(async (conversationId: string, messageText: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          message_text: messageText,
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return { error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return { error: 'Failed to send message' };
    }
  }, [user]);

  const subscribeToConversation = useCallback((conversationId: string) => {
    if (!user || !conversationId) return;

    if (realtimeChannel) {
      realtimeChannel.unsubscribe();
    }

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);

          if (newMessage.sender_id !== user.id) {
            supabase
              .from('messages')
              .update({ is_read: true, read_at: new Date().toISOString() })
              .eq('id', newMessage.id);
          }

          fetchConversations();
        }
      )
      .subscribe();

    setRealtimeChannel(channel);
  }, [user, realtimeChannel, fetchConversations]);

  const unsubscribeFromConversation = useCallback(() => {
    if (realtimeChannel) {
      realtimeChannel.unsubscribe();
      setRealtimeChannel(null);
    }
  }, [realtimeChannel]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    return () => {
      if (realtimeChannel) {
        realtimeChannel.unsubscribe();
      }
    };
  }, [realtimeChannel]);

  return {
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    loading,
    unreadCount,
    fetchConversations,
    fetchMessages,
    getOrCreateConversation,
    sendMessage,
    subscribeToConversation,
    unsubscribeFromConversation,
  };
};
