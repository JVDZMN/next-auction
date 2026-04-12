import { useEffect } from 'react';
import { io } from 'socket.io-client';

type Notification = {
  id: string;
  message: string;
  type: string;
  carId?: string | null;
  createdAt: string;
};

let socket: ReturnType<typeof io> | null = null;

export function useNotificationSocket(
  userId: string,
  onNotification: (n: Notification) => void
) {
  useEffect(() => {
    if (!userId) return;

    // Reuse existing socket if already connected for this user
    if (!socket || !socket.connected) {
      socket = io({ path: '/api/socketio' });
    }

    socket.emit('joinUserRoom', userId);
    socket.on('newNotification', onNotification);

    return () => {
      socket?.off('newNotification', onNotification);
    };
  }, [userId, onNotification]);
}
