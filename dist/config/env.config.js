"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.envConfig = void 0;
exports.validateEnv = validateEnv;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from .env file
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
exports.envConfig = {
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
function validateEnv() {
    const missing = [];
    if (!exports.envConfig.mongodbUri)
        missing.push('MONGODB_URI');
    if (!exports.envConfig.jwtSecret)
        missing.push('JWT_SECRET');
    if (exports.envConfig.isProduction) {
        if (!process.env.JWT_SECRET || exports.envConfig.jwtSecret === 'super_secret_dev_jwt_key_secushield_2026') {
            missing.push('JWT_SECRET (must provide strong custom secret in production)');
        }
        if (!process.env.MONGODB_URI || exports.envConfig.mongodbUri.includes('localhost') || exports.envConfig.mongodbUri.includes('127.0.0.1')) {
            missing.push('MONGODB_URI (cannot use localhost MongoDB URI in production)');
        }
        if (!process.env.CORS_ORIGIN || exports.envConfig.corsOrigin === '*') {
            console.warn('[SECURITY WARNING] CORS_ORIGIN is set to wildcard (*) in production. For web browsers, configure specific origins (e.g. https://yourdomain.com).');
        }
    }
    if (missing.length > 0) {
        throw new Error(`[Fatal] Environment validation failed for production: ${missing.join(', ')}`);
    }
}
