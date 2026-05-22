import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket<T = unknown>(carId: string, onMessage: (msg: T) => void) {
  const [socket, setSocket] = useState<Socket | null>(null);
  // Keep a ref so the cleanup closure always reaches the live socket instance
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:4000', { path: '/api/socketio' });
    socketRef.current = newSocket;
    if (carId) {
      newSocket.emit('joinCarRoom', carId);
    }
    newSocket.on('newMessage', onMessage);
    // Defer state update out of the synchronous effect body (satisfies react-hooks/set-state-in-effect)
    const id = setTimeout(() => setSocket(newSocket), 0);
    return () => {
      clearTimeout(id);
      newSocket.off('newMessage', onMessage);
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [carId, onMessage]);

  return socket;
}
