import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { User, RefreshToken } from '../models';
import {
  generateAccessToken,
  generateOpaqueRefreshToken,
  hashToken,
  parseDurationToMs,
} from '../utils/jwt.util';
import { envConfig } from '../config/env.config';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

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

    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('User account has been deactivated', 'ACCOUNT_DEACTIVATED');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Generate Access Token (JWT) & Refresh Token (Opaque)
    const accessToken = generateAccessToken(user);
    const refreshToken = generateOpaqueRefreshToken();
    const tokenHash = hashToken(refreshToken);
    const familyId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + parseDurationToMs(envConfig.refreshTokenExpiresIn));

    // Save refresh session in DB
    await RefreshToken.create({
      userId: user._id,
      tokenHash,
      familyId,
      expiresAt,
      createdByIp: req.ip,
      userAgent: req.get('user-agent'),
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
      token: accessToken, // Backward compatibility
      accessToken,
      refreshToken,
      user: userPayload,
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken || typeof refreshToken !== 'string') {
      throw ApiError.badRequest('Refresh token is required', 'MISSING_REFRESH_TOKEN');
    }

    const presentedTokenHash = hashToken(refreshToken);
    const tokenRecord = await RefreshToken.findOne({ tokenHash: presentedTokenHash });

    // REUSE DETECTION: If token exists but has already been revoked/rotated
    if (tokenRecord && tokenRecord.revokedAt) {
      logger.warn(
        `[SECURITY WARNING] Refresh token reuse detected for family ${tokenRecord.familyId}. Revoking all sessions in token family.`
      );
      // Revoke all tokens belonging to this family
      await RefreshToken.updateMany(
        { familyId: tokenRecord.familyId, revokedAt: null },
        { revokedAt: new Date() }
      );
      throw ApiError.unauthorized('Invalid or revoked refresh token', 'INVALID_REFRESH_TOKEN');
    }

    // Validation
    if (!tokenRecord || tokenRecord.expiresAt.getTime() <= Date.now()) {
      throw ApiError.unauthorized('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const user = await User.findById(tokenRecord.userId);
    if (!user || !user.isActive) {
      tokenRecord.revokedAt = new Date();
      await tokenRecord.save();
      throw ApiError.unauthorized('User account is inactive or missing', 'ACCOUNT_DEACTIVATED');
    }

    // ROTATION: Revoke old token and issue new token pair within the same familyId
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateOpaqueRefreshToken();
    const newTokenHash = hashToken(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + parseDurationToMs(envConfig.refreshTokenExpiresIn));

    tokenRecord.revokedAt = new Date();
    tokenRecord.replacedByTokenHash = newTokenHash;
    await tokenRecord.save();

    await RefreshToken.create({
      userId: user._id,
      tokenHash: newTokenHash,
      familyId: tokenRecord.familyId,
      expiresAt: newExpiresAt,
      createdByIp: req.ip,
      userAgent: req.get('user-agent'),
    });

    ApiResponse.success(res, 200, 'Token refreshed successfully', {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = req.body;

    if (refreshToken && typeof refreshToken === 'string') {
      const presentedTokenHash = hashToken(refreshToken);
      await RefreshToken.findOneAndUpdate(
        { tokenHash: presentedTokenHash, revokedAt: null },
        { revokedAt: new Date() }
      );
    }

    ApiResponse.success(res, 200, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
}

export async function logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user || !req.user.id) {
      throw ApiError.unauthorized('Not authenticated', 'UNAUTHORIZED');
    }

    await RefreshToken.updateMany(
      { userId: req.user.id, revokedAt: null },
      { revokedAt: new Date() }
    );

    ApiResponse.success(res, 200, 'All sessions logged out successfully');
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
