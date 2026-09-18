import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { ApiError } from '../utils/apiError';

export function validateObjectId(...paramNames: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    for (const paramName of paramNames) {
      const paramValue = req.params[paramName];
      if (paramValue && (typeof paramValue !== 'string' || !Types.ObjectId.isValid(paramValue))) {
        return next(
          ApiError.badRequest(
            `Invalid format for parameter '${paramName}'. Expected valid 24-character hex ObjectId.`,
            'INVALID_OBJECT_ID'
          )
        );
      }
    }
    next();
  };
}
