import { Request, Response, NextFunction } from 'express';
import { checkVersion, VersionConfig } from '../../middleware/versioning';

describe('Versioning Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  const config: VersionConfig = {
    minVersion: '1.0.0',
    maxVersion: '2.0.0'
  };

  beforeEach(() => {
    mockRequest = {
      headers: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  it('should pass with valid version in range', () => {
    mockRequest.headers = {
      'x-api-version': '1.5.0'
    };

    checkVersion(config)(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  it('should use default version when no version is provided', () => {
    checkVersion(config)(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  it('should reject invalid version format', () => {
    mockRequest.headers = {
      'x-api-version': 'invalid'
    };

    checkVersion(config)(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Invalid version format. Please use semantic versioning (e.g., 1.0.0)'
    });
  });

  it('should reject version below minimum', () => {
    mockRequest.headers = {
      'x-api-version': '0.9.0'
    };

    checkVersion(config)(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: `API version ${mockRequest.headers['x-api-version']} is not supported. Minimum version is ${config.minVersion}`
    });
  });

  it('should reject version above maximum', () => {
    mockRequest.headers = {
      'x-api-version': '2.1.0'
    };

    checkVersion(config)(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: `API version ${mockRequest.headers['x-api-version']} is not supported. Maximum version is ${config.maxVersion}`
    });
  });

  it('should handle edge case versions', () => {
    mockRequest.headers = {
      'x-api-version': '1.0.0'
    };

    checkVersion(config)(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();

    mockRequest.headers['x-api-version'] = '2.0.0';

    checkVersion(config)(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });
}); 