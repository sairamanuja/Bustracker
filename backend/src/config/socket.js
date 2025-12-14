const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // In production, specify your mobile app's origin
      methods: ['GET', 'POST']
    }
  });

  // Socket.io authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId} (${socket.userRole})`);

    // Driver joins their trip room when starting a trip
    socket.on('driver:join-trip', (tripId) => {
      if (socket.userRole !== 'driver') {
        socket.emit('error', { message: 'Only drivers can join trip rooms' });
        return;
      }
      socket.join(`trip:${tripId}`);
      console.log(`🚌 Driver ${socket.userId} joined trip ${tripId}`);
    });

    // User joins a trip room to track bus
    socket.on('user:track-trip', (tripId) => {
      socket.join(`trip:${tripId}`);
      console.log(`👤 User ${socket.userId} tracking trip ${tripId}`);
    });

    // User leaves trip room
    socket.on('user:untrack-trip', (tripId) => {
      socket.leave(`trip:${tripId}`);
      console.log(`👤 User ${socket.userId} stopped tracking trip ${tripId}`);
    });

    // Driver sends location update
    socket.on('driver:location-update', async (data) => {
      if (socket.userRole !== 'driver') {
        socket.emit('error', { message: 'Only drivers can send location updates' });
        return;
      }

      const { tripId, lat, lng } = data;

      // Update trip location in database
      try {
        const { query } = require('./database');
        await query(
          'UPDATE trips SET current_location = $1 WHERE id = $2 AND driver_id = $3',
          [JSON.stringify({ lat, lng, timestamp: new Date() }), tripId, socket.userId]
        );

        // Broadcast location to all users tracking this trip
        io.to(`trip:${tripId}`).emit('trip:location-updated', {
          tripId,
          lat,
          lng,
          timestamp: new Date()
        });

        console.log(`📍 Location updated for trip ${tripId}: ${lat}, ${lng}`);
      } catch (error) {
        console.error('Error updating location:', error);
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initializeSocket, getIO };
