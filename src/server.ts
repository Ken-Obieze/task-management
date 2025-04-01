import http from 'http';
import dotenv from 'dotenv';
import app from './app';
import { logger } from './utils/logger';
import { connectDB } from './config/db.config';
import { connectRedis } from './config/redis.config';
import { initSocket } from './config/socket.config';


// Load environment variables
dotenv.config();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Connect to database and Redis
const startServer = async () => {
    try {
      // Connect to MongoDB
      await connectDB();
      
      // Connect to Redis
      await connectRedis();
      
      // Start server
      const PORT = process.env.PORT || 5000;
      server.listen(PORT, () => {
        logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      });
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error starting server: ${error.message}`);
      } else {
        logger.error('Unknown error occurred when starting server');
      }
      process.exit(1);
    }
  };
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err: Error) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
  });
  
  // Start server
  startServer();
