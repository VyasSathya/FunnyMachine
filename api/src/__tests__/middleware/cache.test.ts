import { Request, Response, NextFunction } from 'express';
import { cache, clearCache } from '../../middleware/cache';
import redisClient from '../../config/redis';
import { JwtPayload } from '../../types/auth';

jest.mock('../../config/redis');

interface MockStream {
  on: (event: string, callback: (data?: any) => void) => MockStream;
}

describe('Cache Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  const mockRedisClient = redisClient as jest.Mocked<typeof redisClient>;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      originalUrl: '/api/v1/test',
      user: { userId: 'test-user', email: 'test@example.com' } as JwtPayload
    };
    mockResponse = {
      json: jest.fn(),
      setHeader: jest.fn()
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('cache middleware', () => {
    it('should skip caching for non-GET requests', async () => {
      mockRequest.method = 'POST';
      
      await cache()(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRedisClient.get).not.toHaveBeenCalled();
    });

    it('should return cached data if available', async () => {
      const cachedData = { test: 'data' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedData));

      await cache()(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRedisClient.get).toHaveBeenCalledWith('GET:/api/v1/test:test-user');
      expect(mockResponse.json).toHaveBeenCalledWith(cachedData);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should cache response data when no cache exists', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      const responseData = { test: 'response' };

      await cache()(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Simulate response
      (mockResponse as any).json(responseData);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'GET:/api/v1/test:test-user',
        300,
        JSON.stringify(responseData)
      );
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should use custom cache key generator if provided', async () => {
      const customKeyGenerator = (req: Request) => `custom:${req.originalUrl}`;
      
      await cache({ key: customKeyGenerator })(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRedisClient.get).toHaveBeenCalledWith('custom:/api/v1/test');
    });

    it('should use custom TTL if provided', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      const responseData = { test: 'response' };
      const customTTL = 600;

      await cache({ expire: customTTL })(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Simulate response
      (mockResponse as any).json(responseData);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'GET:/api/v1/test:test-user',
        customTTL,
        JSON.stringify(responseData)
      );
    });

    it('should handle errors gracefully', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

      await cache()(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('clearCache', () => {
    it('should clear cache keys matching pattern', async () => {
      const mockKeys = ['key1', 'key2'];
      const mockStream: MockStream = {
        on: (event: string, callback: (data?: any) => void): MockStream => {
          if (event === 'data') callback(mockKeys);
          if (event === 'end') callback();
          return mockStream;
        }
      };

      mockRedisClient.scanStream.mockReturnValue(mockStream as any);
      const mockPipeline = {
        del: jest.fn(),
        exec: jest.fn().mockResolvedValue([])
      };
      mockRedisClient.pipeline.mockReturnValue(mockPipeline as any);

      await clearCache('test:*');

      expect(mockRedisClient.scanStream).toHaveBeenCalledWith({
        match: 'test:*',
        count: 100
      });
      expect(mockPipeline.del).toHaveBeenCalledTimes(2);
      expect(mockPipeline.exec).toHaveBeenCalled();
    });

    it('should handle errors during cache clearing', async () => {
      const error = new Error('Redis error');
      const mockStream: MockStream = {
        on: (event: string, callback: (data?: any) => void): MockStream => {
          if (event === 'error') callback(error);
          return mockStream;
        }
      };

      mockRedisClient.scanStream.mockReturnValue(mockStream as any);

      await expect(clearCache('test:*')).rejects.toThrow('Redis error');
    });
  });
}); 