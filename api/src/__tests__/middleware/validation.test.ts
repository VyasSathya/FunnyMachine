import { Request, Response, NextFunction } from 'express';
import { validateSchema } from '../../middleware/validation';
import { Schema } from 'joi';

jest.mock('joi', () => ({
  object: jest.fn().mockReturnThis(),
  string: jest.fn().mockReturnThis(),
  required: jest.fn().mockReturnThis(),
  validate: jest.fn()
}));

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let mockSchema: Schema;

  beforeEach(() => {
    mockRequest = {
      body: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
    mockSchema = {
      validate: jest.fn()
    } as any;
    jest.clearAllMocks();
  });

  it('should pass validation with valid data', () => {
    mockRequest.body = {
      email: 'test@example.com',
      password: 'password123'
    };

    (mockSchema.validate as jest.Mock).mockReturnValue({
      error: null,
      value: mockRequest.body
    });

    validateSchema(mockSchema)(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockSchema.validate).toHaveBeenCalledWith(mockRequest.body, {
      abortEarly: false,
      stripUnknown: true
    });
    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  it('should reject invalid data with validation errors', () => {
    mockRequest.body = {
      email: 'invalid-email',
      password: '123'
    };

    const validationError = {
      details: [
        {
          path: ['email'],
          message: 'Invalid email format'
        },
        {
          path: ['password'],
          message: 'Password must be at least 8 characters long'
        }
      ]
    };

    (mockSchema.validate as jest.Mock).mockReturnValue({
      error: validationError,
      value: mockRequest.body
    });

    validateSchema(mockSchema)(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockSchema.validate).toHaveBeenCalledWith(mockRequest.body, {
      abortEarly: false,
      stripUnknown: true
    });
    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Validation failed',
      details: [
        {
          field: 'email',
          message: 'Invalid email format'
        },
        {
          field: 'password',
          message: 'Password must be at least 8 characters long'
        }
      ]
    });
  });

  it('should handle validation of query parameters', () => {
    mockRequest.query = {
      page: '1',
      limit: '10'
    };

    (mockSchema.validate as jest.Mock).mockReturnValue({
      error: null,
      value: mockRequest.query
    });

    validateSchema(mockSchema, 'query')(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockSchema.validate).toHaveBeenCalledWith(mockRequest.query, {
      abortEarly: false,
      stripUnknown: true
    });
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should handle validation of URL parameters', () => {
    mockRequest.params = {
      id: '123'
    };

    (mockSchema.validate as jest.Mock).mockReturnValue({
      error: null,
      value: mockRequest.params
    });

    validateSchema(mockSchema, 'params')(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockSchema.validate).toHaveBeenCalledWith(mockRequest.params, {
      abortEarly: false,
      stripUnknown: true
    });
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should handle empty validation errors', () => {
    mockRequest.body = {};

    (mockSchema.validate as jest.Mock).mockReturnValue({
      error: {
        details: []
      },
      value: mockRequest.body
    });

    validateSchema(mockSchema)(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockSchema.validate).toHaveBeenCalledWith(mockRequest.body, {
      abortEarly: false,
      stripUnknown: true
    });
    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Validation failed',
      details: []
    });
  });

  it('should handle validation errors with missing details', () => {
    mockRequest.body = {};

    (mockSchema.validate as jest.Mock).mockReturnValue({
      error: {},
      value: mockRequest.body
    });

    validateSchema(mockSchema)(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockSchema.validate).toHaveBeenCalledWith(mockRequest.body, {
      abortEarly: false,
      stripUnknown: true
    });
    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Validation failed',
      details: []
    });
  });
}); 