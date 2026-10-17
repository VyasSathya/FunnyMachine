import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient: Redis | null = null;

try {
  console.log('Initializing Redis client...');
  redisClient = new Redis({
    host: '127.0.0.1',
    port: 6379,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      console.log(`Retrying Redis connection (attempt ${times + 1}) in ${delay}ms`);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
    showFriendlyErrorStack: true
  });

  redisClient.on('error', (error: Error) => {
    console.error('Redis Client Error:', error);
    console.error('Error stack:', error.stack);
  });

  redisClient.on('connect', () => {
    console.log('Connected to Redis');
  });

  redisClient.on('ready', () => {
    console.log('Redis client is ready');
  });

  redisClient.on('reconnecting', () => {
    console.log('Redis client is reconnecting...');
  });

  redisClient.on('close', () => {
    console.log('Redis connection closed');
  });

  redisClient.on('end', () => {
    console.log('Redis connection ended');
  });

  // Connect to Redis
  console.log('Attempting to connect to Redis...');
  redisClient.connect().catch((error: Error) => {
    console.error('Failed to connect to Redis:', error);
    console.error('Error stack:', error.stack);
  });
} catch (error) {
  console.error('Failed to initialize Redis client:', error instanceof Error ? error.message : error);
  console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
}

// Create a wrapper that handles Redis unavailability
const redisWrapper = {
  get: async (key: string) => {
    if (!redisClient) {
      console.warn('Redis client not initialized');
      return null;
    }
    try {
      return await redisClient.get(key);
    } catch (error) {
      console.error('Redis get error:', error instanceof Error ? error.message : error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
      return null;
    }
  },
  setex: async (key: string, seconds: number, value: string) => {
    if (!redisClient) {
      console.warn('Redis client not initialized');
      return;
    }
    try {
      await redisClient.setex(key, seconds, value);
    } catch (error) {
      console.error('Redis setex error:', error instanceof Error ? error.message : error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    }
  },
  scanStream: (options: any) => {
    if (!redisClient) {
      console.warn('Redis client not initialized');
      return {
        on: (event: string, callback: Function) => {
          if (event === 'end') callback();
        }
      };
    }
    return redisClient.scanStream(options);
  },
  pipeline: () => {
    if (!redisClient) {
      console.warn('Redis client not initialized');
      return {
        del: () => {},
        exec: () => Promise.resolve([])
      };
    }
    return redisClient.pipeline();
  }
};

export default redisWrapper; 