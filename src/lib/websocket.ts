import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:5001';
      
      this.socket = io(wsUrl, {
        auth: {
          userId
        },
        transports: ['websocket']
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        this.handleReconnect();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        reject(error);
      });
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.socket?.connect();
      }, 1000 * this.reconnectAttempts);
    }
  }

  joinRoom(roomId: string) {
    this.socket?.emit('join_room', roomId);
  }

  leaveRoom(roomId: string) {
    this.socket?.emit('leave_room', roomId);
  }

  sendMessage(roomId: string, message: string, senderId: string) {
    this.socket?.emit('send_message', {
      roomId,
      message,
      senderId,
      timestamp: new Date().toISOString()
    });
  }

  onMessage(callback: (data: any) => void) {
    this.socket?.on('new_message', callback);
  }

  onUserJoined(callback: (data: any) => void) {
    this.socket?.on('user_joined', callback);
  }

  onUserLeft(callback: (data: any) => void) {
    this.socket?.on('user_left', callback);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const websocketService = new WebSocketService();