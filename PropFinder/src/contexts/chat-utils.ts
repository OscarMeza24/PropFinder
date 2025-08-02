import { Message as ApiMessage, Conversation as ApiConversation } from "../services/api";
import { Message as MessageType, ChatRoom } from "./chat-context-utils";

// Convert API Message to frontend Message type
export const convertApiMessageToMessage = (apiMessage: ApiMessage): MessageType => {
  return {
    id: apiMessage.id.toString(),
    senderId: apiMessage.sender_id.toString(),
    senderName: apiMessage.sender_name || "Usuario",
    senderAvatar: undefined,
    content: apiMessage.content,
    timestamp: apiMessage.created_at,
    type: apiMessage.message_type,
    isRead: apiMessage.is_read,
  };
};

// Convert API Conversation to frontend ChatRoom type
export const convertApiConversationToChatRoom = (
  apiConversation: ApiConversation
): ChatRoom => {
  return {
    id: `room_${apiConversation.other_user_id}`,
    name: apiConversation.other_user_name,
    participants: [],
    lastMessage: apiConversation.last_message
      ? {
          id: "temp",
          senderId: "temp",
          senderName: "Usuario",
          content: apiConversation.last_message,
          timestamp: apiConversation.last_message_time || new Date().toISOString(),
          type: "text",
          isRead: false,
        }
      : undefined,
    unreadCount: apiConversation.unread_count,
    otherUserId: apiConversation.other_user_id,
    otherUserName: apiConversation.other_user_name,
    otherUserEmail: apiConversation.other_user_email,
  };
};
