import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const envConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/security_management',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_dev_jwt_key_secushield_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  trustProxy: process.env.TRUST_PROXY === 'false' ? false : true,
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
  loginRateLimitMax: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '10', 10), // 10 attempts
  apiRateLimitMax: parseInt(process.env.API_RATE_LIMIT_MAX || '300', 10), // 300 requests
};

export function validateEnv(): void {
  const missing: string[] = [];

  if (!envConfig.mongodbUri) missing.push('MONGODB_URI');
  if (!envConfig.jwtSecret) missing.push('JWT_SECRET');

  if (envConfig.isProduction) {
    if (envConfig.jwtSecret === 'super_secret_dev_jwt_key_secushield_2026') {
      console.warn('[SECURITY WARNING] Using default JWT secret in production environment!');
    }
  }

  if (missing.length > 0) {
    throw new Error(`[Fatal] Missing required environment variables: ${missing.join(', ')}`);
  }
}

