import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket<T = unknown>(carId: string, onMessage: (msg: T) => void) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:4000', { path: '/api/socketio' });
    setSocket(newSocket);
    if (carId) {
      newSocket.emit('joinCarRoom', carId);
    }
    newSocket.on('newMessage', onMessage);
    return () => {
      newSocket.off('newMessage', onMessage);
      newSocket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carId, onMessage]);

  return socket;
}
