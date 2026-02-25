import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';


export function useSocket(carId: string, onMessage: (msg: any) => void) {
  // Always create a new socket instance per component
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
