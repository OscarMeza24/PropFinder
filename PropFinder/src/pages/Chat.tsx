import React, { useState, useMemo } from 'react';
import { Send, Phone, Video, MoreVertical, Paperclip, Smile } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/auth-context-utils';
<<<<<<< HEAD
import QuickReviewButton from '../components/ui/QuickReviewButton';
=======
import { Message, ChatRoom } from '../contexts/chat-context-utils';

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
>>>>>>> 0a75f108a1f1c5c29884dd6fb4a7c9efcb669365

const Chat: React.FC = () => {
  const { user } = useAuth();
  // Obtenemos activeRoom directamente del contexto, ya que ahora es la fuente de verdad.
  const { chatRooms, activeRoom, messages, sendMessage, joinRoom, isConnected } = useChat();
  const [newMessage, setNewMessage] = useState('');

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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
<<<<<<< HEAD
    if (newMessage.trim() && activeRoom) {
      sendMessage(newMessage, activeRoom.otherUserId);
=======
    if (!newMessage.trim() || !activeRoom || !user) return;

    // Si la sala activa es el asistente, manejamos la lógica localmente.
    if (activeRoom.id === 'virtual-assistant') {
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
>>>>>>> 0a75f108a1f1c5c29884dd6fb4a7c9efcb669365
      setNewMessage('');

      // Simulamos la respuesta del bot.
      setTimeout(() => {
        const botResponse = getBotResponse(userMessageForBot);
        setVirtualAssistantMessages(prev => [...prev, botResponse]);
      }, 1000);
    } else {
      // Si es un chat real, usamos la función del contexto.
      // Nos aseguramos de pasar otherUserId, que es un número.
      if (typeof activeRoom.otherUserId === 'number' && activeRoom.otherUserId !== -1) {
        sendMessage(newMessage, activeRoom.otherUserId);
        setNewMessage('');
      }
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Decidimos qué mensajes mostrar basándonos en la sala activa.
  const messagesToDisplay = activeRoom?.id === 'virtual-assistant' ? virtualAssistantMessages : messages;

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
    <div className="h-screen bg-gray-50 flex font-sans">
      <div className="w-full max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Chats</h2>
              <span className={`text-xs font-semibold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {allChatRooms.map((room) => (
              <div
                key={room.id}
                // Al hacer clic, llamamos a joinRoom, que ahora también gestiona la sala activa.
                onClick={() => joinRoom(room.id as string)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${activeRoom?.id === room.id ? 'bg-blue-50 border-blue-200' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 truncate">{room.name}</h3>
                  {room.unreadCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {room.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {room.lastMessage ? room.lastMessage.content : 'No hay mensajes aún.'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="w-2/3 flex flex-col bg-gray-100">
          {activeRoom ? (
            <>
              {/* Header */}
              <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <span className="font-bold text-blue-600">{activeRoom.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{activeRoom.name}</h3>
                    <p className="text-sm text-gray-600">{activeRoom.id === 'virtual-assistant' ? 'En línea' : 'Agente en línea'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <Phone size={20} />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <Video size={20} />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messagesToDisplay.map((message) => (
                  <div
<<<<<<< HEAD
                    key={room.id}
                    onClick={() => joinRoom(room.otherUserId)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      activeRoom?.id === room.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{room.name}</h3>
                      {room.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                          {room.unreadCount}
                        </span>
=======
                    key={message.id}
                    className={`flex ${String(message.senderId) === String(user.id) ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${String(message.senderId) === String(user.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                        }`}>
                      {String(message.senderId) !== String(user.id) && (
                        <div className="text-xs font-semibold mb-1 opacity-75">
                          {message.senderName}
                        </div>
>>>>>>> 0a75f108a1f1c5c29884dd6fb4a7c9efcb669365
                      )}
                      <div>{message.content}</div>
                      <div className={`text-xs mt-1 ${String(message.senderId) === String(user.id) ? 'text-blue-100' : 'text-gray-500'}`}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="p-4 bg-white border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex items-center">
                  <button type="button" className="p-2 text-gray-600 hover:text-blue-600">
                    <Paperclip size={20} />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 mx-2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="button" className="p-2 text-gray-600 hover:text-blue-600">
                    <Smile size={20} />
                  </button>
                  <button
                    type="submit"
                    className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                    // El botón se deshabilita en chats reales si no hay conexión.
                    disabled={!newMessage.trim() || (activeRoom.id !== 'virtual-assistant' && !isConnected)}
                  >
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Bienvenido al Chat de PropFinder</h2>
                <p className="text-gray-600 mt-2">Selecciona una conversación para empezar a chatear.</p>
              </div>
            </div>
<<<<<<< HEAD

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {activeRoom ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{activeRoom.name}</h3>
                        <p className="text-sm text-gray-600">Agente en línea</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <QuickReviewButton
                          targetId="agent-1" // En producción esto vendría del contexto del chat
                          targetName={activeRoom.name}
                          targetType="agent"
                          buttonText="Evaluar"
                          buttonSize="sm"
                          variant="outline"
                        />
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
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === user.id.toString() ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderId === user.id.toString()
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          {message.senderId !== user.id.toString() && (
                            <div className="text-xs font-semibold mb-1 opacity-75">
                              {message.senderName}
                            </div>
                          )}
                          <div>{message.content}</div>
                          <div className={`text-xs mt-1 ${
                            message.senderId === user.id.toString() ? 'text-blue-100' : 'text-gray-500'
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
=======
          )}
>>>>>>> 0a75f108a1f1c5c29884dd6fb4a7c9efcb669365
        </div>
      </div>
    </div>
  );
};

export default Chat;