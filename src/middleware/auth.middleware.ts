import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util';
import { User } from '../models/user.model';
import { ApiError } from '../utils/apiError';

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication required. Missing or malformed token.', 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      throw ApiError.unauthorized('Invalid or expired authentication token.', 'INVALID_TOKEN');
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User account not found or deactivated.', 'USER_INACTIVE');
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      providerId: user.providerId,
      buildingId: user.buildingId,
    };

    next();
  } catch (error) {
    next(error);
  }
}
