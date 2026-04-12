import { Server } from 'socket.io';

// Global singleton so App Router routes can emit events
const globalForSocket = globalThis as unknown as { _io: Server | undefined };

export function setSocketServer(io: Server) {
  globalForSocket._io = io;
}

export function emitToUser(userId: string, event: string, data: unknown) {
  globalForSocket._io?.to(`user:${userId}`).emit(event, data);
}
