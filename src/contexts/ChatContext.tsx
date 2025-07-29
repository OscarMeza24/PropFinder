import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { websocketService } from '../lib/websocket';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file';
  created_at: string;
  sender?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface ChatRoom {
  id: string;
  name: string;
  property_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  participants?: Array<{
    id: string;
    name: string;
    avatar_url?: string;
  }>;
  last_message?: Message;
  unread_count?: number;
}

interface ChatContextType {
  rooms: ChatRoom[];
  activeRoom: ChatRoom | null;
  messages: Message[];
  loading: boolean;
  connected: boolean;
  createRoom: (name: string, propertyId?: string, participantIds?: string[]) => Promise<ChatRoom>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => void;
  sendMessage: (content: string, type?: 'text' | 'image' | 'file') => Promise<void>;
  getRooms: () => Promise<void>;
  deleteRoom: (roomId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      initializeWebSocket();
      getRooms();
    }

    return () => {
      websocketService.disconnect();
    };
  }, [user]);

  const initializeWebSocket = async () => {
    if (!user) return;

    try {
      await websocketService.connect(user.id);
      setConnected(true);

      websocketService.onMessage((data) => {
        setMessages(prev => [...prev, data]);
      });

      websocketService.onUserJoined((data) => {
        console.log('User joined:', data);
      });

      websocketService.onUserLeft((data) => {
        console.log('User left:', data);
      });
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      setConnected(false);
    }
  };

  const getRooms = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get rooms where user is a participant
      const { data: roomData, error: roomError } = await supabase
        .from('room_participants')
        .select(`
          room_id,
          chat_rooms (
            id,
            name,
            property_id,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id);

      if (roomError) {
        throw roomError;
      }

      const roomIds = roomData?.map(r => r.room_id) || [];
      
      if (roomIds.length === 0) {
        setRooms([]);
        return;
      }

      // Get participants for each room
      const { data: participantsData, error: participantsError } = await supabase
        .from('room_participants')
        .select(`
          room_id,
          users (
            id,
            name,
            avatar_url
          )
        `)
        .in('room_id', roomIds);

      if (participantsError) {
        throw participantsError;
      }

      // Get last message for each room
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:users!chat_messages_sender_id_fkey (
            id,
            name,
            avatar_url
          )
        `)
        .in('room_id', roomIds)
        .order('created_at', { ascending: false });

      if (messagesError) {
        throw messagesError;
      }

      // Combine data
      const roomsWithData = roomData?.map(item => {
        const room = item.chat_rooms;
        if (!room) return null;

        const participants = participantsData
          ?.filter(p => p.room_id === room.id)
          .map(p => p.users)
          .filter(Boolean) || [];

        const lastMessage = messagesData?.find(m => m.room_id === room.id);

        return {
          ...room,
          participants,
          last_message: lastMessage || undefined
        };
      }).filter(Boolean) as ChatRoom[];

      setRooms(roomsWithData || []);
    } catch (error: any) {
      console.error('Error fetching rooms:', error);
      toast.error('Error al cargar las conversaciones');
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async (name: string, propertyId?: string, participantIds?: string[]): Promise<ChatRoom> => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      // Create room
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name,
          property_id: propertyId,
          created_by: user.id
        })
        .select()
        .single();

      if (roomError) {
        throw roomError;
      }

      // Add participants
      const participants = [user.id, ...(participantIds || [])];
      const participantInserts = participants.map(userId => ({
        room_id: roomData.id,
        user_id: userId
      }));

      const { error: participantsError } = await supabase
        .from('room_participants')
        .insert(participantInserts);

      if (participantsError) {
        throw participantsError;
      }

      await getRooms();
      return roomData;
    } catch (error: any) {
      console.error('Error creating room:', error);
      toast.error('Error al crear la conversación');
      throw error;
    }
  };

  const joinRoom = async (roomId: string) => {
    try {
      const room = rooms.find(r => r.id === roomId);
      if (!room) return;

      setActiveRoom(room);
      websocketService.joinRoom(roomId);

      // Load messages
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:users!chat_messages_sender_id_fkey (
            id,
            name,
            avatar_url
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      setMessages(data || []);
    } catch (error: any) {
      console.error('Error joining room:', error);
      toast.error('Error al unirse a la conversación');
    }
  };

  const leaveRoom = () => {
    if (activeRoom) {
      websocketService.leaveRoom(activeRoom.id);
    }
    setActiveRoom(null);
    setMessages([]);
  };

  const sendMessage = async (content: string, type: 'text' | 'image' | 'file' = 'text') => {
    if (!user || !activeRoom) return;

    try {
      // Save to database
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: activeRoom.id,
          sender_id: user.id,
          content,
          message_type: type
        })
        .select(`
          *,
          sender:users!chat_messages_sender_id_fkey (
            id,
            name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      // Send via WebSocket
      websocketService.sendMessage(activeRoom.id, content, user.id);

      // Update local state
      setMessages(prev => [...prev, data]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar el mensaje');
    }
  };

  const deleteRoom = async (roomId: string) => {
    try {
      const { error } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('id', roomId);

      if (error) {
        throw error;
      }

      if (activeRoom?.id === roomId) {
        leaveRoom();
      }

      await getRooms();
      toast.success('Conversación eliminada');
    } catch (error: any) {
      console.error('Error deleting room:', error);
      toast.error('Error al eliminar la conversación');
    }
  };

  const value = {
    rooms,
    activeRoom,
    messages,
    loading,
    connected,
    createRoom,
    joinRoom,
    leaveRoom,
    sendMessage,
    getRooms,
    deleteRoom
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};