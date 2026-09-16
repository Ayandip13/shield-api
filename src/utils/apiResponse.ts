import { Response } from 'express';
import { ApiResponseFormat } from '../types/api.types';

export class ApiResponse {
  static success<T>(res: Response, statusCode = 200, message = 'Success', data?: T): Response {
    const responseBody: ApiResponseFormat<T> = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(responseBody);
  }

  static error(
    res: Response,
    statusCode = 500,
    message = 'An unexpected error occurred',
    code = 'INTERNAL_ERROR',
    details?: unknown
  ): Response {
    const responseBody: ApiResponseFormat = {
      success: false,
      message,
      error: {
        code,
        details,
      },
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(responseBody);
  }
}
