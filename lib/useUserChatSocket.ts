import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useUserChatSocket<T = unknown>(userId: string, peerId: string, onMessage: (msg: T) => void) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!userId || !peerId) return;
    const newSocket = io({ path: '/api/socketio' });
    setSocket(newSocket);
    // Join both user rooms
    newSocket.emit('joinUserRoom', userId);
    newSocket.emit('joinUserRoom', peerId);
    newSocket.on('newMessage', onMessage);
    return () => {
      newSocket.off('newMessage', onMessage);
      newSocket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, peerId, onMessage]);

  return socket;
}
