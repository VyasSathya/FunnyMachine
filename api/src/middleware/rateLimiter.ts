import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';

let redisClient: any = null;

try {
  console.log('Initializing rate limiter Redis client...');
  redisClient = createClient({
    url: 'redis://127.0.0.1:6379',
    socket: {
      reconnectStrategy: (retries: number) => {
        const delay = Math.min(retries * 50, 2000);
        console.log(`Retrying rate limiter Redis connection (attempt ${retries + 1}) in ${delay}ms`);
        return delay;
      }
    }
  });

  // Connect to Redis
  console.log('Attempting to connect to rate limiter Redis...');
  redisClient.connect().catch((error: Error) => {
    console.error('Failed to connect to Redis for rate limiting:', error);
    console.error('Error stack:', error.stack);
  });

  redisClient.on('error', (error: Error) => {
    console.error('Rate Limiter Redis Client Error:', error);
    console.error('Error stack:', error.stack);
  });
  redisClient.on('connect', () => console.log('Rate limiter Redis client connected'));
  redisClient.on('reconnecting', () => console.log('Rate limiter Redis client reconnecting...'));
  redisClient.on('close', () => console.log('Rate limiter Redis connection closed'));
  redisClient.on('end', () => console.log('Rate limiter Redis connection ended'));
} catch (error) {
  console.error('Failed to initialize rate limiter Redis client:', error instanceof Error ? error.message : error);
  console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
}

interface RateLimiterOptions {
  windowMs: number;
  max: number;
}

const defaultOptions: RateLimiterOptions = {
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
};

export const rateLimiter = (
  options: Partial<RateLimiterOptions> = {}
) => {
  const opts: RateLimiterOptions = {
    ...defaultOptions,
    ...options,
  };

  return async (req: Request, res: Response, next: NextFunction) => {
    // If Redis is not available, allow all requests
    if (!redisClient) {
      console.warn('Rate limiter Redis client not initialized, allowing all requests');
      return next();
    }

    try {
      const key = `${req.ip || 'unknown'}:${req.path}`;
      const requests = await redisClient.get(key);
      const currentRequests = requests ? parseInt(requests) : 0;

      if (currentRequests >= opts.max) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests, please try again later.',
        });
      }

      await redisClient.setEx(key, Math.floor(opts.windowMs / 1000), (currentRequests + 1).toString());

      res.setHeader('X-RateLimit-Limit', opts.max);
      res.setHeader('X-RateLimit-Remaining', opts.max - currentRequests - 1);

      next();
    } catch (error) {
      console.error('Rate limiter error:', error instanceof Error ? error.message : error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
      next(); // Allow request to proceed if Redis fails
    }
  };
}; 