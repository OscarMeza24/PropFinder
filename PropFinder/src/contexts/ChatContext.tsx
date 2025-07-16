import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file';
}

export interface ChatRoom {
  id: string;
  name: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  propertyId?: string;
}

interface ChatContextType {
  chatRooms: ChatRoom[];
  activeRoom: ChatRoom | null;
  messages: Message[];
  sendMessage: (content: string, roomId: string) => void;
  createRoom: (name: string, participants: string[], propertyId?: string) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  markAsRead: (roomId: string) => void;
  isConnected: boolean;
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
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (user) {
      // Simular conexión WebSocket
      setIsConnected(true);
      
      // Mock chat rooms
      const mockRooms: ChatRoom[] = [
        {
          id: '1',
          name: 'Luxury Downtown Apartment',
          participants: [user.id, 'agent1'],
          lastMessage: {
            id: '1',
            senderId: 'agent1',
            senderName: 'Sarah Johnson',
            senderAvatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150',
            content: 'Hi! I saw you\'re interested in this property. Would you like to schedule a viewing?',
            timestamp: new Date().toISOString(),
            type: 'text'
          },
          unreadCount: 1,
          propertyId: '1'
        },
        {
          id: '2',
          name: 'Modern Family House',
          participants: [user.id, 'agent2'],
          lastMessage: {
            id: '2',
            senderId: user.id,
            senderName: user.name,
            senderAvatar: user.avatar || '',
            content: 'Thank you for the information!',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            type: 'text'
          },
          unreadCount: 0,
          propertyId: '2'
        }
      ];
      
      setChatRooms(mockRooms);
    }
  }, [user]);

  const sendMessage = (content: string, roomId: string) => {
    if (!user) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar || '',
      content,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    setMessages(prev => [...prev, newMessage]);
    
    // Actualizar último mensaje en la sala
    setChatRooms(prev => prev.map(room => 
      room.id === roomId 
        ? { ...room, lastMessage: newMessage }
        : room
    ));

    // Simular respuesta del agente
    setTimeout(() => {
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        senderId: 'agent1',
        senderName: 'Sarah Johnson',
        senderAvatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150',
        content: 'Thanks for your message! I\'ll get back to you shortly.',
        timestamp: new Date().toISOString(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, agentResponse]);
    }, 2000);
  };

  const createRoom = (name: string, participants: string[], propertyId?: string) => {
    const newRoom: ChatRoom = {
      id: Date.now().toString(),
      name,
      participants,
      unreadCount: 0,
      propertyId
    };
    
    setChatRooms(prev => [...prev, newRoom]);
    return newRoom;
  };

  const joinRoom = (roomId: string) => {
    const room = chatRooms.find(r => r.id === roomId);
    if (room) {
      setActiveRoom(room);
      
      // Mock messages para la sala
      const mockMessages: Message[] = [
        {
          id: '1',
          senderId: 'agent1',
          senderName: 'Sarah Johnson',
          senderAvatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150',
          content: 'Hello! Welcome to PropFinder. How can I help you today?',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          type: 'text'
        },
        {
          id: '2',
          senderId: user?.id || '',
          senderName: user?.name || '',
          senderAvatar: user?.avatar || '',
          content: 'Hi, I\'m interested in viewing this property. When would be a good time?',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          type: 'text'
        },
        {
          id: '3',
          senderId: 'agent1',
          senderName: 'Sarah Johnson',
          senderAvatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150',
          content: 'Great! I have availability tomorrow at 2 PM or Friday at 10 AM. Which works better for you?',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          type: 'text'
        }
      ];
      
      setMessages(mockMessages);
      markAsRead(roomId);
    }
  };

  const leaveRoom = () => {
    setActiveRoom(null);
    setMessages([]);
  };

  const markAsRead = (roomId: string) => {
    setChatRooms(prev => prev.map(room => 
      room.id === roomId 
        ? { ...room, unreadCount: 0 }
        : room
    ));
  };

  const value = {
    chatRooms,
    activeRoom,
    messages,
    sendMessage,
    createRoom,
    joinRoom,
    leaveRoom,
    markAsRead,
    isConnected
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};