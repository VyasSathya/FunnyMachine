import { Request, Response, NextFunction } from 'express';
import { rateLimiter } from '../../middleware/rateLimiter';
import Redis from 'redis';

// Mock Redis client
jest.mock('redis', () => {
  return {
    createClient: jest.fn().mockReturnValue({
      connect: jest.fn(),
      get: jest.fn(),
      setEx: jest.fn(),
      on: jest.fn(),
    }),
  };
});

describe('Rate Limiter Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();
  let mockRedisClient: any;

  beforeEach(() => {
    mockRequest = {
      ip: '127.0.0.1',
      path: '/api/test',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
    };
    mockRedisClient = Redis.createClient();
    jest.clearAllMocks();
  });

  it('should allow request when rate limit is not exceeded', async () => {
    mockRedisClient.get.mockResolvedValue('5');

    await rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRedisClient.get).toHaveBeenCalledWith(expect.stringContaining('127.0.0.1:/api/test'));
    expect(mockRedisClient.setEx).toHaveBeenCalled();
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(Number));
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should block request when rate limit is exceeded', async () => {
    mockRedisClient.get.mockResolvedValue('100');

    await rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRedisClient.get).toHaveBeenCalledWith(expect.stringContaining('127.0.0.1:/api/test'));
    expect(mockResponse.status).toHaveBeenCalledWith(429);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Too many requests, please try again later.',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should create new rate limit entry for first request', async () => {
    mockRedisClient.get.mockResolvedValue(null);

    await rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRedisClient.get).toHaveBeenCalledWith(expect.stringContaining('127.0.0.1:/api/test'));
    expect(mockRedisClient.setEx).toHaveBeenCalledWith(
      expect.stringContaining('127.0.0.1:/api/test'),
      expect.any(Number),
      '1'
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(Number));
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should handle Redis errors gracefully', async () => {
    mockRedisClient.get.mockRejectedValue(new Error('Redis connection error'));

    await rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRedisClient.get).toHaveBeenCalledWith(expect.stringContaining('127.0.0.1:/api/test'));
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should use correct rate limit window', async () => {
    mockRedisClient.get.mockResolvedValue('1');

    await rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRedisClient.setEx).toHaveBeenCalledWith(
      expect.stringContaining('127.0.0.1:/api/test'),
      60, // Default window of 60 seconds
      '2'
    );
  });

  it('should handle requests without IP address', async () => {
    mockRequest.ip = undefined;

    await rateLimiter(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRedisClient.get).toHaveBeenCalledWith(expect.stringContaining('unknown:/api/test'));
    expect(nextFunction).toHaveBeenCalled();
  });
}); 