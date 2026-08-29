import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/shapeteam?schema=public',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  useMockDb: process.env.USE_MOCK_DB === 'true' || false,
  useMockCache: process.env.USE_MOCK_CACHE === 'true' || false,
};
