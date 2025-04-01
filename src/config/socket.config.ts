import { Server } from 'socket.io';
import http from 'http';
import { logger } from '../utils/logger';

let io: Server;

export const initSocket = (server: http.Server): Server => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on('join', (userId: string) => {
      socket.join(userId);
      logger.info(`User ${userId} joined their room`);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized. Please call initSocket first.');
  }
  return io;
};

export const emitTaskUpdate = (userId: string, task: any): void => {
  getIO().to(userId).emit('taskUpdate', task);
};
