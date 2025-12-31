const { Server } = require('socket.io');
let io = null;

export default function SocketHandler(req, res) {
  if (!res.socket.server.io) {
    const httpServer = res.socket.server;
    io = new Server(httpServer, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      // Join room for a car auction
      socket.on('joinCarRoom', (carId) => {
        socket.join(carId);
      });
      // Messaging: send message to car owner
      socket.on('sendMessage', (data) => {
        // data: { carId, message, senderEmail, receiverId }
        io.to(data.carId).emit('newMessage', data);
      });
    });
  }
  res.end();
}
