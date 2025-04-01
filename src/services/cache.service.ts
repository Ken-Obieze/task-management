import redisClient from '../config/redis.config';
import { logger } from '../utils/logger';

class CacheService {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: any, expiration?: number): Promise<void> {
    try {
      const options = expiration ? { EX: expiration } : undefined;
      await redisClient.set(key, JSON.stringify(value), options);
    } catch (error) {
      logger.error('Redis SET error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error('Redis DEL error:', error);
    }
  }

  async clearByPattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      logger.error('Redis Clear Pattern error:', error);
    }
  }
}

export const cacheService = new CacheService();
