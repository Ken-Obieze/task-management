// jest.setup.ts
import 'dotenv/config'; // Load environment variables
import { jest } from '@jest/globals';

// Mock Redis (if needed)
jest.mock('ioredis', () => {
  const Redis = require('ioredis-mock');
  return new Redis();
});

jest.setTimeout(10000);
