export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, code = 'ERROR', details?: unknown, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, code = 'BAD_REQUEST', details?: unknown): ApiError {
    return new ApiError(400, message, code, details);
  }

  static unauthorized(message = 'Unauthorized access', code = 'UNAUTHORIZED'): ApiError {
    return new ApiError(401, message, code);
  }

  static forbidden(message = 'Access forbidden', code = 'FORBIDDEN'): ApiError {
    return new ApiError(403, message, code);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND'): ApiError {
    return new ApiError(404, message, code);
  }

  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR'): ApiError {
    return new ApiError(500, message, code, undefined, false);
  }
}
