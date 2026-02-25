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

  socket.on('joinCarRoom', (carId) => {
    socket.join(carId);
    console.log(`Socket ${socket.id} joined car room ${carId}`);
  });

  socket.on('sendMessage', (data) => {
    // Broadcast to all clients in the car room
    io.to(data.carId).emit('newMessage', data.message);
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
