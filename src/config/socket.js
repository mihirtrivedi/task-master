let io;

module.exports = {
  init: (server) => {
    const { Server } = require('socket.io');
    const jwt = require('jsonwebtoken');
    const tokenBlocklist = require('../utils/tokenBlocklist');

    io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
      },
    });

    io.use((socket, next) => {
      let token = socket.handshake.auth?.token;
      if (!token && socket.handshake.headers?.authorization) {
        const parts = socket.handshake.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
          token = parts[1];
        }
      }

      if (!token) {
        return next(new Error('Authentication required'));
      }

      if (tokenBlocklist.isBlocked(token)) {
        return next(new Error('Token revoked'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    io.on('connection', (socket) => {
      socket.join(socket.userId.toString());

      socket.on('disconnect', () => {
        // connection closed
      });
    });

    return io;
  },
  getIo: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  },
};
