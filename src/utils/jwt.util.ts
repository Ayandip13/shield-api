import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { envConfig } from '../config/env.config';
import { UserRole } from '../models/user.model';

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

export function generateToken(payload: JwtPayload): string {
  const secret: Secret = envConfig.jwtSecret;
  const options: SignOptions = {
    expiresIn: envConfig.jwtExpiresIn as any,
  };
  return jwt.sign(payload, secret, options);
}

export function verifyToken(token: string): JwtPayload {
  const secret: Secret = envConfig.jwtSecret;
  return jwt.verify(token, secret) as JwtPayload;
}
