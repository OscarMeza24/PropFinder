import React, { useState, useMemo } from 'react';
import { Send, Phone, Video, MoreVertical, Paperclip, Smile } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/auth-context-utils';
import { Message, ChatRoom } from '../contexts/chat-context-utils';
import QuickReviewButton from '../components/ui/QuickReviewButton';

// La lógica del bot permanece igual, es una función pura y no causa problemas.
const getBotResponse = (userInput: string): Message => {
  const lowerInput = userInput.toLowerCase();
  let responseContent = "No he entendido tu pregunta. Un agente se pondrá en contacto contigo para ayudarte.";

  if (lowerInput.includes('hola') || lowerInput.includes('buenos dias') || lowerInput.includes('buenas tardes')) {
    responseContent = '¡Hola! Bienvenido a PropFinder. ¿En qué puedo ayudarte hoy?';
  } else if (lowerInput.includes('horario')) {
    responseContent = 'Nuestros horarios de atención son de lunes a viernes, de 9:00 a.m. a 6:00 p.m., y los sábados de 10:00 a.m. a 2:00 p.m.';
  } else if (lowerInput.includes('tipo') || lowerInput.includes('propiedades')) {
    responseContent = 'Manejamos una amplia variedad de propiedades, incluyendo casas, departamentos, terrenos y locales comerciales. ¿Hay algo en específico que estés buscando?';
  } else if (lowerInput.includes('gracias')) {
    responseContent = '¡De nada! Ha sido un placer ayudarte. Si tienes más preguntas, no dudes en consultarme.';
  }

  return {
    id: String(Date.now()),
    content: responseContent,
    senderId: 'bot',
    senderName: 'Asistente Virtual',
    timestamp: new Date().toISOString(),
    type: 'text',
    isRead: false
  };
};

const Chat: React.FC = () => {
  const { user } = useAuth();
  // Obtenemos activeRoom directamente del contexto, ya que ahora es la fuente de verdad.
  const { chatRooms, activeRoom, messages, sendMessage, joinRoom, isConnected } = useChat();
  const [newMessage, setNewMessage] = useState('');
  const [localActiveRoom, setLocalActiveRoom] = useState<ChatRoom | null>(null);

  // Estado local SOLO para los mensajes del asistente virtual.
  const [virtualAssistantMessages, setVirtualAssistantMessages] = useState<Message[]>([
    {
      id: String(Date.now()),
      content: '¡Hola! Soy tu asistente virtual. ¿Cómo puedo ayudarte hoy?',
      senderId: 'bot',
      senderName: 'Asistente Virtual',
      timestamp: new Date().toISOString(),
      type: 'text',
      isRead: false
    },
  ]);

  // Creamos el objeto del asistente virtual para mostrarlo en la lista.
  const virtualAssistantRoom: ChatRoom = useMemo(() => ({
    id: 'virtual-assistant',
    name: 'Asistente Virtual',
    otherUserId: -1, // ID inválido para distinguirlo
    unreadCount: 0,
    lastMessage: virtualAssistantMessages[virtualAssistantMessages.length - 1],
    // Propiedades añadidas para cumplir con el tipo ChatRoom
    participants: [],
    otherUserName: 'Asistente Virtual',
    otherUserEmail: '',
  }), [virtualAssistantMessages]);

  // Combinamos los chats reales del contexto con nuestro chat virtual.
  const allChatRooms = useMemo(() => [virtualAssistantRoom, ...chatRooms], [virtualAssistantRoom, chatRooms]);

  const handleRoomSelect = (room: ChatRoom) => {
    if (room.id === 'virtual-assistant') {
      // Para el asistente virtual, actualizamos el estado local
      setLocalActiveRoom(room);
    } else {
      // Para chats reales, usar la función del contexto y limpiar el estado local
      setLocalActiveRoom(null);
      joinRoom(room.otherUserId);
    }
  };

  // Determinar cuál es la sala activa: la local (asistente virtual) o la del contexto
  const currentActiveRoom = localActiveRoom || activeRoom;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentActiveRoom || !user) return;

    // Si la sala activa es el asistente, manejamos la lógica localmente.
    if (currentActiveRoom.id === 'virtual-assistant') {
      const userMessage: Message = {
        id: String(Date.now()),
        content: newMessage,
        senderId: String(user.id),
        senderName: 'Tú',
        timestamp: new Date().toISOString(),
        type: 'text',
        isRead: false
      };
      setVirtualAssistantMessages(prev => [...prev, userMessage]);

      const userMessageForBot = newMessage;
      setNewMessage('');

      // Simulamos la respuesta del bot.
      setTimeout(() => {
        const botResponse = getBotResponse(userMessageForBot);
        setVirtualAssistantMessages(prev => [...prev, botResponse]);
      }, 1000);
    } else {
      // Si es un chat real, usamos la función del contexto.
      // Nos aseguramos de pasar otherUserId, que es un número.
      if (typeof currentActiveRoom.otherUserId === 'number' && currentActiveRoom.otherUserId !== -1) {
        sendMessage(newMessage, currentActiveRoom.otherUserId);
        setNewMessage('');
      }
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Decidimos qué mensajes mostrar basándonos en la sala activa.
  const messagesToDisplay = currentActiveRoom?.id === 'virtual-assistant' ? virtualAssistantMessages : messages;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-8">
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Chat no disponible</h2>
          <p className="text-gray-600">Por favor, inicia sesión para acceder al chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[600px]">
          <div className="flex h-full">
            {/* Chat List */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Mensajes</h2>
                <div className="flex items-center mt-2">
                  <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-600">
                    {isConnected ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {allChatRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => handleRoomSelect(room)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      currentActiveRoom?.id === room.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{room.name}</h3>
                      {room.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                          {room.unreadCount}
                        </span>
                      )}
                    </div>
                    {room.lastMessage && (
                      <div className="text-sm text-gray-600 truncate">
                        {room.lastMessage.senderName}: {room.lastMessage.content}
                      </div>
                    )}
                    {room.lastMessage && (
                      <div className="text-xs text-gray-400 mt-1">
                        {formatTime(room.lastMessage.timestamp)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {currentActiveRoom ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{currentActiveRoom.name}</h3>
                        <p className="text-sm text-gray-600">
                          {currentActiveRoom.id === 'virtual-assistant' ? 'Asistente en línea' : 'Agente en línea'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {currentActiveRoom.id !== 'virtual-assistant' && (
                          <QuickReviewButton
                            targetId="agent-1" // En producción esto vendría del contexto del chat
                            targetName={currentActiveRoom.name}
                            targetType="agent"
                            buttonText="Evaluar"
                            buttonSize="sm"
                            variant="outline"
                          />
                        )}
                        <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                          <Phone className="h-5 w-5" />
                        </button>
                        <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                          <Video className="h-5 w-5" />
                        </button>
                        <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messagesToDisplay.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${String(message.senderId) === String(user.id) ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            String(message.senderId) === String(user.id)
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          {String(message.senderId) !== String(user.id) && (
                            <div className="text-xs font-semibold mb-1 opacity-75">
                              {message.senderName}
                            </div>
                          )}
                          <div>{message.content}</div>
                          <div className={`text-xs mt-1 ${
                            String(message.senderId) === String(user.id) ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatTime(message.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                      <button
                        type="button"
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <Paperclip className="h-5 w-5" />
                      </button>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Escribe un mensaje..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-2 p-1 text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          <Smile className="h-5 w-5" />
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-4">💬</div>
                    <h3 className="text-xl font-semibold mb-2">Selecciona una conversación</h3>
                    <p>Elige un chat para comenzar a conversar</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;