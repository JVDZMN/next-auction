import { Server } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HttpServer } from 'http';
import type { Socket as NetSocket } from 'net';
import { setSocketServer } from '@/lib/socket-server';

interface SocketWithServer extends NetSocket {
  server: HttpServer & { io?: Server };
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithServer;
}

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    const httpServer = res.socket.server;
    const io = new Server(httpServer, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });
    res.socket.server.io = io;
    setSocketServer(io);

    io.on('connection', (socket) => {
      // Car room for bid updates
      socket.on('joinCarRoom', (carId: string) => {
        socket.join(carId);
      });
      socket.on('sendMessage', (data: { carId: string }) => {
        io.to(data.carId).emit('newMessage', data);
      });

      // User room for personal notifications
      socket.on('joinUserRoom', (userId: string) => {
        socket.join(`user:${userId}`);
      });
    });
  }
  res.end();
}
