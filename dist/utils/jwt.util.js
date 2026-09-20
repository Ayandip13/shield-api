"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.verifyAccessToken = verifyAccessToken;
exports.generateOpaqueRefreshToken = generateOpaqueRefreshToken;
exports.hashToken = hashToken;
exports.parseDurationToMs = parseDurationToMs;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const env_config_1 = require("../config/env.config");
function generateAccessToken(user) {
    const secret = env_config_1.envConfig.jwtSecret;
    const payload = {
        userId: user._id.toString(),
        role: user.role,
        providerId: user.providerId ? user.providerId.toString() : '',
        buildingId: user.buildingId ? user.buildingId.toString() : null,
        tokenType: 'access',
        jti: crypto_1.default.randomUUID(),
    };
    const options = {
        subject: user._id.toString(),
        expiresIn: env_config_1.envConfig.accessTokenExpiresIn,
    };
    return jsonwebtoken_1.default.sign(payload, secret, options);
}
function verifyAccessToken(token) {
    const secret = env_config_1.envConfig.jwtSecret;
    const decoded = jsonwebtoken_1.default.verify(token, secret);
    if (decoded.tokenType !== 'access') {
        throw new Error('Invalid token type');
    }
    return decoded;
}
// Generate a cryptographically secure 256-bit random opaque refresh token
function generateOpaqueRefreshToken() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
// Compute SHA-256 hash of refresh token for secure database storage
function hashToken(token) {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
}
// Parse duration strings (e.g. '15m', '30d', '1h', '7d') into milliseconds
function parseDurationToMs(durationStr) {
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
