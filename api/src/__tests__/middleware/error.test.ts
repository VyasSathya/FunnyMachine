import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../middleware/error';

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('should handle ValidationError', () => {
    const error = new Error('Validation failed');
    (error as any).name = 'ValidationError';
    (error as any).details = [{ message: 'Field is required' }];

    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Validation failed',
      details: [{ message: 'Field is required' }],
    });
  });

  it('should handle DatabaseError', () => {
    const error = new Error('Database connection failed');
    (error as any).name = 'DatabaseError';

    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Internal server error',
    });
  });

  it('should handle AuthenticationError', () => {
    const error = new Error('Invalid credentials');
    (error as any).name = 'AuthenticationError';

    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid credentials',
    });
  });

  it('should handle NotFoundError', () => {
    const error = new Error('Resource not found');
    (error as any).name = 'NotFoundError';

    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Resource not found',
    });
  });

  it('should handle generic Error', () => {
    const error = new Error('Something went wrong');

    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Internal server error',
    });
  });

  it('should handle error with custom status code', () => {
    const error = new Error('Custom error');
    (error as any).statusCode = 422;

    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(422);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Custom error',
    });
  });
}); 