import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export function errorMiddleware(
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    logger.warn(`Operational Error [${err.statusCode}]: ${err.message}`);
    ApiResponse.error(res, err.statusCode, err.message, err.code, err.details);
    return;
  }

  logger.error(`Unhandled Error: ${err.message}`, err.stack);
  ApiResponse.error(
    res,
    500,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    'INTERNAL_SERVER_ERROR'
  );
}
