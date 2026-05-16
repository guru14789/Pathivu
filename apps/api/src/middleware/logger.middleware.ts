import { Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';
import { AuthRequest } from './auth.middleware.js';

export const requestLogger = (req: AuthRequest, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, url } = req;
    const { statusCode } = res;
    const userId = req.user?.user_id || 'anonymous';

    logger.info(`${method} ${url} ${statusCode} ${duration}ms`, {
      method,
      url,
      statusCode,
      duration,
      userId,
    });
  });

  next();
};
