import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function useSocket(carId: string, onMessage: (msg: any) => void) {
  useEffect(() => {
    if (!socket) {
      socket = io({ path: '/api/socketio' });
    }
    if (carId) {
      socket.emit('joinCarRoom', carId);
    }
    socket.on('newMessage', onMessage);
    return () => {
      socket?.off('newMessage', onMessage);
    };
  }, [carId, onMessage]);

  return socket;
}
