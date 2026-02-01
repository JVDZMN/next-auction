import { Server } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';

let io: Server | null = null;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(res.socket as any).server.io) {
    const httpServer = (res.socket as any).server;
    io = new Server(httpServer, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });
    (res.socket as any).server.io = io;

    io.on('connection', (socket) => {
      socket.on('joinCarRoom', (carId) => {
        socket.join(carId);
      });
      socket.on('sendMessage', (data) => {
        io?.to(data.carId).emit('newMessage', data);
      });
    });
  }
  res.end();
}
