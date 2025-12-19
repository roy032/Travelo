import { createServer } from "http";
import app from "./app.js";
import connectDatabase from "./config/database.js";
import { initializeSocket } from "./socket/chatSocket.js";

const PORT = process.env.PORT || 3000;

// Initialize database connection and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.IO
    initializeSocket(httpServer);
    console.log("Socket.IO initialized");

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
      console.log(`Socket.IO server ready on ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
