import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/user.model';
import { ApiError } from '../utils/apiError';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.', 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access forbidden. Role '${req.user.role}' is not authorized to access this resource.`,
          'FORBIDDEN_ROLE'
        )
      );
    }

    next();
  };
}
