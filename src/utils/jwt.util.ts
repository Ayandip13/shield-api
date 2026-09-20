import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { envConfig } from '../config/env.config';
import { IUser, UserRole } from '../models/user.model';

export interface JwtPayload {
  userId: string;
  role: UserRole;
  providerId: string;
  buildingId?: string | null;
  tokenType: 'access';
  jti: string;
}

export function generateAccessToken(user: IUser): string {
  const secret: Secret = envConfig.jwtSecret;
  const payload: JwtPayload = {
    userId: user._id.toString(),
    role: user.role,
    providerId: user.providerId ? user.providerId.toString() : '',
    buildingId: user.buildingId ? user.buildingId.toString() : null,
    tokenType: 'access',
    jti: crypto.randomUUID(),
  };

  const options: SignOptions = {
    subject: user._id.toString(),
    expiresIn: envConfig.accessTokenExpiresIn as any,
  };

  return jwt.sign(payload, secret, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  const secret: Secret = envConfig.jwtSecret;
  const decoded = jwt.verify(token, secret) as JwtPayload;

  if (decoded.tokenType !== 'access') {
    throw new Error('Invalid token type');
  }

  return decoded;
}

// Generate a cryptographically secure 256-bit random opaque refresh token
export function generateOpaqueRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Compute SHA-256 hash of refresh token for secure database storage
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Parse duration strings (e.g. '15m', '30d', '1h', '7d') into milliseconds
export function parseDurationToMs(durationStr: string): number {
  const match = /^(\d+)([smhd])$/.exec(durationStr.trim());
  if (!match) {
    // Default to 30 days if unrecognized
    return 30 * 24 * 60 * 60 * 1000;
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 30 * 24 * 60 * 60 * 1000;
  }
}
