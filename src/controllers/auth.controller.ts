import { Request, Response, NextFunction } from 'express';
import { User } from '../models/user.model';
import { generateToken } from '../utils/jwt.util';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    // Request input validation
    if (!email || typeof email !== 'string' || !email.trim()) {
      throw ApiError.badRequest('Email is required', 'MISSING_EMAIL');
    }
    if (!password || typeof password !== 'string') {
      throw ApiError.badRequest('Password is required', 'MISSING_PASSWORD');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      throw ApiError.badRequest('Invalid email format', 'INVALID_EMAIL_FORMAT');
    }

    // Find active user with passwordHash
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('User account has been deactivated', 'ACCOUNT_DEACTIVATED');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      role: user.role,
    });

    const userPayload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      providerId: user.providerId.toString(),
      buildingId: user.buildingId ? user.buildingId.toString() : null,
    };

    ApiResponse.success(res, 200, 'Login successful', {
      token,
      user: userPayload,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Not authenticated', 'UNAUTHORIZED');
    }

    ApiResponse.success(res, 200, 'User profile retrieved successfully', {
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
}
