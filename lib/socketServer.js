// Node.js Socket.IO server for real-time auction messaging

const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer();
const io = new Server(server, {
  path: '/api/socketio',
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});


io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join car room for auction chat
  socket.on('joinCarRoom', (carId) => {
    socket.join(carId);
    console.log(`Socket ${socket.id} joined car room ${carId}`);
  });

  // Join user room for direct messages
  socket.on('joinUserRoom', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`Socket ${socket.id} joined user room user:${userId}`);
  });

  // Send message to car room and receiver's user room
  socket.on('sendMessage', (data) => {
    io.to(data.carId).emit('newMessage', data.message);
    if (data.receiverId) {
      io.to(`user:${data.receiverId}`).emit('newMessage', data.message);
      console.log(`Message also sent to user room user:${data.receiverId}`);
    }
    console.log(`Message sent to car room ${data.carId}:`, data.message);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.SOCKET_PORT || 4000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
