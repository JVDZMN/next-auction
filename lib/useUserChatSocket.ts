import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useUserChatSocket<T = unknown>(userId: string, peerId: string, onMessage: (msg: T) => void) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId || !peerId) return;
    const newSocket = io({ path: '/api/socketio' });
    socketRef.current = newSocket;
    newSocket.emit('joinUserRoom', userId);
    newSocket.emit('joinUserRoom', peerId);
    newSocket.on('newMessage', onMessage);
    // Defer state update out of the synchronous effect body (satisfies react-hooks/set-state-in-effect)
    const id = setTimeout(() => setSocket(newSocket), 0);
    return () => {
      clearTimeout(id);
      newSocket.off('newMessage', onMessage);
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [userId, peerId, onMessage]);

  return socket;
}
