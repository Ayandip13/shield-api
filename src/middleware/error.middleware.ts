import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export function errorMiddleware(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Operational ApiError
  if (err instanceof ApiError) {
    logger.warn(`Operational Error [${err.statusCode}]: ${err.message}`);
    ApiResponse.error(res, err.statusCode, err.message, err.code, err.details);
    return;
  }

  // Handle Express body-parser SyntaxError (invalid JSON body)
  if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
    logger.warn(`JSON Parse Error: ${err.message}`);
    ApiResponse.error(res, 400, 'Malformed JSON payload in request body.', 'MALFORMED_JSON');
    return;
  }

  // Handle Mongoose CastError (invalid ObjectId or type casting error)
  if (err.name === 'CastError') {
    logger.warn(`Mongoose CastError: Invalid value for field ${err.path}`);
    ApiResponse.error(
      res,
      400,
      `Invalid format for field '${err.path}'.`,
      'INVALID_FORMAT'
    );
    return;
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((e: any) => e.message);
    logger.warn(`Mongoose ValidationError: ${messages.join(', ')}`);
    ApiResponse.error(
      res,
      400,
      messages[0] || 'Validation error',
      'VALIDATION_ERROR',
      messages
    );
    return;
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const keys = err.keyValue ? Object.keys(err.keyValue).join(', ') : 'field';
    logger.warn(`Mongoose DuplicateKey Error: ${keys}`);
    ApiResponse.error(
      res,
      409,
      `A record with this ${keys} already exists.`,
      'DUPLICATE_RESOURCE'
    );
    return;
  }

  // Unhandled / Internal Server Error
  logger.error(`Unhandled Server Error: ${err.message}`, err.stack);
  ApiResponse.error(
    res,
    500,
    process.env.NODE_ENV === 'production' ? 'An internal server error occurred.' : err.message,
    'INTERNAL_SERVER_ERROR'
  );
}
