import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context-utils';
import apiService from '../services/api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'message' | 'visit' | 'payment' | 'favorite';
  isRead: boolean;
  createdAt: string;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  loadNotifications: (unreadOnly?: boolean) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Cargar notificaciones desde la API
  const loadNotifications = useCallback(async (unreadOnly = false) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.getNotifications(unreadOnly);
      setNotifications(response.notifications);
      
      // Actualizar contador de no leídas
      const countResponse = await apiService.getUnreadNotificationCount();
      setUnreadCount(countResponse.unreadCount);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Error cargando notificaciones";
      setError(errorMessage);
      console.error("Error cargando notificaciones:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Marcar notificación como leída
  const markAsRead = useCallback(async (id: string) => {
    if (!user) return;

    try {
      await apiService.markNotificationAsRead(id);
      
      // Actualizar estado local
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );
      
      // Actualizar contador
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error);
    }
  }, [user]);

  // Marcar todas las notificaciones como leídas
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      await apiService.markAllNotificationsAsRead();
      
      // Actualizar estado local
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      
      // Actualizar contador
      setUnreadCount(0);
    } catch (error) {
      console.error("Error al marcar todas las notificaciones como leídas:", error);
    }
  }, [user]);

  // Eliminar notificación
  const deleteNotification = useCallback(async (id: string) => {
    if (!user) return;

    try {
      await apiService.deleteNotification(id);
      
      // Actualizar estado local
      const deletedNotification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      
      // Actualizar contador si la notificación no estaba leída
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error al eliminar notificación:", error);
    }
  }, [user, notifications]);

  // Manejar notificaciones en tiempo real a través de WebSocket
  useEffect(() => {
    if (!user) return;

    // Escuchar eventos de notificación desde el WebSocket
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'notification') {
          const newNotification = data.notification;
          
          // Añadir nueva notificación al estado
          setNotifications(prev => [newNotification, ...prev]);
          
          // Incrementar contador de no leídas
          setUnreadCount(prev => prev + 1);
          
          // Aquí se podría mostrar una alerta o toast con la notificación
          console.log('Nueva notificación recibida:', newNotification);
        }
      } catch (error) {
        console.error('Error procesando mensaje de WebSocket:', error);
      }
    };

    // Verificar si ya existe una conexión WebSocket en window
    // Esto evita crear múltiples conexiones
    if (!(window as any).propfinderWs) {
      // Si no existe, crear una nueva conexión
      const token = localStorage.getItem('token');
      const wsUrl = `${import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:5001'}?token=${token}`;
      
      const ws = new WebSocket(wsUrl);
      (window as any).propfinderWs = ws;
      
      ws.onopen = () => {
        console.log('WebSocket conectado');
        setWsConnected(true);
      };
      
      ws.onclose = () => {
        console.log('WebSocket desconectado');
        setWsConnected(false);
        (window as any).propfinderWs = null;
      };
      
      ws.onerror = (error) => {
        console.error('Error en WebSocket:', error);
        setWsConnected(false);
      };
    }
    
    // Asignar el manejador de mensajes
    const ws = (window as any).propfinderWs;
    if (ws) {
      ws.addEventListener('message', handleWebSocketMessage);
    }

    // Cargar notificaciones iniciales
    loadNotifications();
    
    // Limpiar al desmontar
    return () => {
      if (ws) {
        ws.removeEventListener('message', handleWebSocketMessage);
      }
    };
  }, [user, loadNotifications]);

  const contextValue = {
    notifications,
    unreadCount,
    isLoading,
    error,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};