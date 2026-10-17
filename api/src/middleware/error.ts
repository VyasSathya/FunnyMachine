import { Request, Response, NextFunction } from 'express';

interface ErrorWithStatus extends Error {
  statusCode?: number;
  details?: Array<{ message: string }>;
}

export const errorHandler = (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || getStatusCodeFromError(err);
  const errorMessage = getErrorMessage(err);
  const response = {
    success: false,
    error: errorMessage,
    ...(err.details && { details: err.details }),
  };

  res.status(statusCode).json(response);
};

function getStatusCodeFromError(err: ErrorWithStatus): number {
  switch (err.name) {
    case 'ValidationError':
      return 400;
    case 'AuthenticationError':
      return 401;
    case 'NotFoundError':
      return 404;
    case 'DatabaseError':
    default:
      return 500;
  }
}

function getErrorMessage(err: ErrorWithStatus): string {
  switch (err.name) {
    case 'ValidationError':
    case 'AuthenticationError':
    case 'NotFoundError':
      return err.message;
    case 'DatabaseError':
    default:
      return process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;
  }
} 