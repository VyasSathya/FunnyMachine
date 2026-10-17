import { Request, Response, NextFunction } from 'express';
import redisClient from '../config/redis';

interface CacheOptions {
  expire?: number; // Time in seconds
  key?: (req: Request) => string;
}

const defaultKeyGenerator = (req: Request): string => {
  return `${req.method}:${req.originalUrl}:${req.user?.userId || 'anonymous'}`;
};

export const cache = (options: CacheOptions = {}) => {
  const ttl = options.expire || 300; // Default 5 minutes
  const keyGenerator = options.key || defaultKeyGenerator;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = keyGenerator(req);

    try {
      const cachedResponse = await redisClient.get(key);
      
      if (cachedResponse) {
        const data = JSON.parse(cachedResponse);
        return res.json(data);
      }

      // Store the original res.json method
      const originalJson = res.json;

      // Override res.json method to cache the response
      res.json = function(body: any): Response {
        // Restore the original res.json method
        res.json = originalJson;

        // Cache the response
        redisClient.setex(key, ttl, JSON.stringify(body))
          .catch(error => console.error('Redis cache error:', error));

        // Call the original method
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      console.error('Redis cache error:', error);
      next();
    }
  };
};

export const clearCache = (pattern: string) => {
  return new Promise<void>((resolve, reject) => {
    const stream = redisClient.scanStream({
      match: pattern,
      count: 100
    });

    const pipeline = redisClient.pipeline();
    let foundKeys = 0;

    stream.on('data', (keys: string[]) => {
      foundKeys += keys.length;
      keys.forEach(key => {
        pipeline.del(key);
      });
    });

    stream.on('end', () => {
      pipeline.exec()
        .then(() => {
          console.log(`Cleared ${foundKeys} keys matching pattern: ${pattern}`);
          resolve();
        })
        .catch(reject);
    });

    stream.on('error', reject);
  });
}; 