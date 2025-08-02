import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "./auth-context-utils";
import apiService, {
  Message as ApiMessage,
  Conversation as ApiConversation,
} from "../services/api";
import {
  ChatContext,
  Message as MessageType,
  ChatRoom,
} from "./chat-context-utils";
import {
  convertApiMessageToMessage,
  convertApiConversationToChatRoom,
} from "./chat-utils";

export const useChat = () => {
  const context = React.useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  // Define WebSocket message types for better type safety
  type WebSocketMessage = 
    | { type: 'new_message'; message: ApiMessage }
    | { type: 'message_history'; messages: ApiMessage[] }
    | { type: 'messages_read'; senderId: string }
    | { type: 'user_typing'; userId: number; isTyping: boolean }
    | { type: 'user_online'; userId: number; isOnline: boolean };

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data: WebSocketMessage) => {
    switch (data.type) {
      case "new_message": {
        const newMessage = convertApiMessageToMessage(data.message);
        setMessages(prev => [...prev, newMessage]);

        setChatRooms(prev =>
          prev.map(room =>
            room.otherUserId === data.message.sender_id
              ? {
                  ...room,
                  lastMessage: newMessage,
                  unreadCount: room.otherUserId === activeRoom?.otherUserId ? 0 : (room.unreadCount || 0) + 1,
                }
              : room
          )
        );
        break;
      }

      case "messages_read":
        setMessages(prev =>
          prev.map(msg =>
            msg.senderId === data.senderId ? { ...msg, isRead: true } : msg
          )
        );
        break;

      case "message_history": {
        const historyMessages = (data.messages || []).map(convertApiMessageToMessage);
        setMessages(historyMessages);
        break;
      }

      case "user_typing":
        // TODO: Implement typing indicator
        break;

      default:
        console.log("WebSocket message type not handled:", data.type);
    }
  }, [activeRoom]);

  const connectWebSocket = useCallback(() => {
    if (!user) return;

    const token = apiService.getToken();
    if (!token) return;

    try {
      const ws = apiService.createWebSocketConnection(token);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        setTimeout(() => {
          if (user && apiService.isAuthenticated()) {
            connectWebSocket();
          }
        }, 5000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error("Error connecting to WebSocket:", error);
      setIsConnected(false);
    }
  }, [user, handleWebSocketMessage]);

  const loadConversations = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    try {
      const { conversations } = await apiService.getConversations();
      const convertedRooms = conversations.map(convertApiConversationToChatRoom);
      setChatRooms(convertedRooms);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Error loading conversations";
      setError(errorMessage);
      console.error("Error loading conversations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      connectWebSocket();
      loadConversations();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setIsConnected(false);
      }
    };
  }, [user, connectWebSocket, loadConversations]);

  const markAsRead = useCallback(async (otherUserId: number) => {
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "read_messages",
            roomId: `room_${otherUserId}`,
            senderId: otherUserId,
          })
        );
      }

      setMessages(prev =>
        prev.map(msg => ({
          ...msg,
          isRead: true,
        }))
      );

      setChatRooms(prev =>
        prev.map(room =>
          room.otherUserId === otherUserId ? { ...room, unreadCount: 0 } : room
        )
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, []);

  const joinRoom = useCallback(async (otherUserId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const room = chatRooms.find(r => r.otherUserId === otherUserId);
      if (!room) {
        throw new Error("Room not found");
      }

      setActiveRoom(room);

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "join_room",
            roomId: `room_${otherUserId}`,
          })
        );
      }

      const response = await apiService.getConversationMessages(otherUserId);
      const convertedMessages = response.messages.map(convertApiMessageToMessage);
      setMessages(convertedMessages);

      await markAsRead(otherUserId);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Error joining room";
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [chatRooms, markAsRead]);

  const sendMessage = useCallback(async (content: string, receiverId: number) => {
    if (!user || wsRef.current?.readyState !== WebSocket.OPEN) {
      throw new Error("No connection available");
    }

    try {
      const messageData = {
        type: "send_message",
        receiverId,
        content,
        messageType: "text" as const,
      };

      wsRef.current?.send(JSON.stringify(messageData));

      const optimisticMessage: MessageType = {
        id: `temp_${Date.now()}`,
        senderId: user.id.toString(),
        senderName: user.name,
        content,
        timestamp: new Date().toISOString(),
        type: "text",
        isRead: false,
      };

      setMessages(prev => [...prev, optimisticMessage]);
      return optimisticMessage;
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Error sending message";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  const leaveRoom = useCallback(() => {
    setActiveRoom(null);
    setMessages([]);
  }, []);

  const createRoom = useCallback(async (receiverId: number, initialMessage?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiService.createConversation({
        receiverId,
        initialMessage,
      });

      await loadConversations();
      await joinRoom(receiverId);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Error creating conversation";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [joinRoom, loadConversations]);

  const contextValue = useMemo(() => ({
    chatRooms,
    activeRoom,
    messages,
    isConnected,
    isLoading,
    error,
    joinRoom,
    sendMessage,
    loadConversations,
    createRoom,
    leaveRoom,
    markAsRead,
  }), [
    chatRooms,
    activeRoom,
    messages,
    isConnected,
    isLoading,
    error,
    joinRoom,
    sendMessage,
    loadConversations,
    createRoom,
    leaveRoom,
    markAsRead,
  ]);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};