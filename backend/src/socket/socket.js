import {Server} from 'socket.io';

let ioInstance = null;
let leaderboardIOInstance = null;

/**
 * Initialize Socket.io server and bind event handlers
 * @param {Object} server - HTTP Server instance
 * @param {Object} app - Express application instance
 * @returns {Object} Socket.IO instance and namespaces
 */
const initializeSocket = (server, app) => {
  const io = new Server(server, {
    cors: {
      origin: [
        process.env.CLIENT_URL,
        'http://localhost:5173',
        'http://localhost:3000',
      ].filter(Boolean),
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  ioInstance = io;

  // Root namespace for announcements and general notifications
  io.on('connection', (socket) => {
    console.log(`🔌 [Socket.io] Client connected to root: ${socket.id}`);

    // Join event-specific room
    socket.on('joinEvent', (eventId) => {
      socket.join(`event-${eventId}`);
      console.log(`Socket ${socket.id} joined room: event-${eventId}`);
    });

    // Leave event-specific room
    socket.on('leaveEvent', (eventId) => {
      socket.leave(`event-${eventId}`);
      console.log(`Socket ${socket.id} left room: event-${eventId}`);
    });

    // Join user role room
    socket.on('joinUserRole', (role) => {
      if (['admin', 'organizer', 'participant'].includes(role)) {
        socket.join(`role-${role}`);
        console.log(`Socket ${socket.id} joined room: role-${role}`);
      }
    });

    // Test-only manual broadcast trigger
    socket.on('testTriggerAnnouncement', ({ announcement }) => {
      console.log('[SOCKET] Triggering test announcement broadcast');
      io.to(`event-${announcement.eventId}`).emit('newAnnouncement', { announcement });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  // Dedicated namespace for leaderboard updates
  const leaderboardIO = io.of('/leaderboard');
  leaderboardIOInstance = leaderboardIO;

  leaderboardIO.use((socket, next) => {
    // Allows handshake token validation
    next();
  });

  leaderboardIO.on('connection', (socket) => {
    socket.on('join-event', (eventId) => {
      socket.join(`event-${eventId}`);
    });

    socket.on('leave-event', (eventId) => {
      socket.leave(`event-${eventId}`);
    });

    socket.on('disconnect', () => {
      // Disconnected from leaderboard
    });
  });

  // Express middleware to attach socket instances to req
  if (app) {
    app.use((req, res, next) => {
      req.io = io;
      req.leaderboardIO = leaderboardIO;
      next();
    });
  }

  return { io, leaderboardIO };
};

const getIO = () => ioInstance;
const getLeaderboardIO = () => leaderboardIOInstance;

export {
  initializeSocket,
  getIO,
  getLeaderboardIO
};
