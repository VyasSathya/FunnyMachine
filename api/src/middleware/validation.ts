import { Request, Response, NextFunction } from 'express';
import { Schema, ValidationError } from 'joi';

type RequestLocation = 'body' | 'query' | 'params';

export const validateSchema = (schema: Schema, location: RequestLocation = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[location], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(detail => ({
          message: detail.message,
          path: detail.path,
          type: detail.type,
        })),
      });
      return;
    }

    // Update the request with the validated and transformed values
    req[location] = value;
    next();
  };
}; 