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
};
