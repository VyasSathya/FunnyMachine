import { Request, Response, NextFunction } from 'express';
import { logger } from '../../middleware/logger';

describe('Logger Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      path: '/api/test',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent',
      },
    };
    mockResponse = {
      statusCode: 200,
      on: jest.fn(),
    };
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should log request details', () => {
    logger(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[REQUEST]'),
      expect.stringContaining('GET /api/test'),
      expect.stringContaining('127.0.0.1'),
      expect.stringContaining('test-agent')
    );
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should log response details', () => {
    logger(mockRequest as Request, mockResponse as Response, nextFunction);

    const responseCallback = (mockResponse.on as jest.Mock).mock.calls[0][1];
    responseCallback();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[RESPONSE]'),
      expect.stringContaining('GET /api/test'),
      expect.stringContaining('200')
    );
  });

  it('should handle missing request details', () => {
    mockRequest = {
      method: 'GET',
      path: '/api/test',
    };

    logger(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[REQUEST]'),
      expect.stringContaining('GET /api/test'),
      expect.stringContaining('unknown'),
      expect.stringContaining('unknown')
    );
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should log error status codes differently', () => {
    mockResponse.statusCode = 500;

    logger(mockRequest as Request, mockResponse as Response, nextFunction);

    const responseCallback = (mockResponse.on as jest.Mock).mock.calls[0][1];
    responseCallback();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR]'),
      expect.stringContaining('GET /api/test'),
      expect.stringContaining('500')
    );
  });

  it('should include request body in logs if present', () => {
    mockRequest.body = { test: 'data' };

    logger(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[REQUEST]'),
      expect.stringContaining('GET /api/test'),
      expect.stringContaining('127.0.0.1'),
      expect.stringContaining('test-agent'),
      expect.stringContaining('{"test":"data"}')
    );
  });

  it('should handle response errors', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const error = new Error('Test error');

    logger(mockRequest as Request, mockResponse as Response, nextFunction);

    const errorCallback = (mockResponse.on as jest.Mock).mock.calls[1][1];
    errorCallback(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR]'),
      expect.stringContaining('GET /api/test'),
      error
    );

    consoleErrorSpy.mockRestore();
  });
}); 