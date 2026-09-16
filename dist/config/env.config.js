"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.envConfig = void 0;
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
};
