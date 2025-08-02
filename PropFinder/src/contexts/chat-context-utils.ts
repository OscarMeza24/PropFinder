import { createContext, useContext } from 'react';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  type: "text" | "image" | "file" | "location";
  isRead: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  propertyId?: string;
  otherUserId: number;
  otherUserName: string;
  otherUserEmail: string;
}

interface ChatContextType {
  chatRooms: ChatRoom[];
  activeRoom: ChatRoom | null;
  messages: Message[];
  sendMessage: (content: string, receiverId: number) => Promise<Message>;
  createRoom: (receiverId: number, initialMessage?: string) => Promise<void>;
  joinRoom: (otherUserId: number) => Promise<void>;
  leaveRoom: () => void;
  markAsRead: (otherUserId: number) => Promise<void>;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};