import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { sendError } from '../lib/response.js';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const errorId = (req as any).id;

  if (err instanceof ZodError) {
    return sendError(res, {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: err.flatten().fieldErrors,
      status: 400
    }, errorId);
  }

  if (err instanceof AppError) {
    return sendError(res, {
      code: err.code,
      message: err.message,
      details: err.details,
      status: err.statusCode
    }, errorId);
  }

  // Handle Multer errors
  if (err.name === 'MulterError') {
    return sendError(res, {
      code: 'UPLOAD_ERROR',
      message: err.message,
      status: 400
    }, errorId);
  }

  logger.error(`${err.message} [ErrorID: ${errorId}]`, { stack: err.stack, errorId, path: req.path });

  return sendError(res, {
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    details: process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined,
    status: 500
  }, errorId);
};
