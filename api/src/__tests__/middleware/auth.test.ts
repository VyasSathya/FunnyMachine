import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { auth } from '../../middleware/auth';

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('should return 401 if no token is provided', () => {
    auth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'No token provided',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if token format is invalid', () => {
    mockRequest.headers = {
      authorization: 'InvalidFormat token123',
    };

    auth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid token format',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', () => {
    mockRequest.headers = {
      authorization: 'Bearer invalidToken',
    };

    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    auth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid token',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should call next() if token is valid', () => {
    const user = { id: '123', email: 'test@example.com' };
    mockRequest.headers = {
      authorization: 'Bearer validToken',
    };

    (jwt.verify as jest.Mock).mockReturnValue(user);

    auth(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.user).toEqual(user);
    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });
}); 