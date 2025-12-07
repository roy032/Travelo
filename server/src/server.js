import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import connectDatabase from './config/database.js';
import { initializeChatSocket } from './sockets/chat.socket.js';

const PORT = process.env.PORT || 3000;

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO with CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Make io accessible to routes
app.set('io', io);

// Initialize Socket.IO chat handlers
initializeChatSocket(io);

// Initialize database connection and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Start HTTP server (with Socket.IO attached)
    httpServer.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
      console.log('Socket.IO is ready for connections');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { io };