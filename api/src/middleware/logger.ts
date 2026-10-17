import { Request, Response, NextFunction } from 'express';

export const logger = (req: Request, res: Response, next: NextFunction): void => {
  // Log request
  console.log(
    '[REQUEST]',
    `${req.method} ${req.path}`,
    req.ip || 'unknown',
    req.headers['user-agent'] || 'unknown',
    req.body ? JSON.stringify(req.body) : ''
  );

  // Log response
  res.on('finish', () => {
    const logLevel = res.statusCode >= 400 ? '[ERROR]' : '[RESPONSE]';
    console.log(
      logLevel,
      `${req.method} ${req.path}`,
      res.statusCode
    );
  });

  // Log errors
  res.on('error', (error: Error) => {
    console.error(
      '[ERROR]',
      `${req.method} ${req.path}`,
      error
    );
  });

  next();
}; 