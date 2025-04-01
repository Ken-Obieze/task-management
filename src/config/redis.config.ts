import { createClient } from 'redis';
import { logger } from '../utils/logger';

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
});

redisClient.on('error', (error) => {
  logger.error('Redis Client Error:', error);
});

redisClient.on('connect', () => {
  logger.info('Redis connected successfully');
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('Redis connection error:', error);
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    await redisClient.disconnect();
    logger.info('Redis disconnected');
  } catch (error) {
    logger.error('Redis disconnection error:', error);
  }
};

export default redisClient;
