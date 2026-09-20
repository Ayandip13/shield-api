"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.refresh = refresh;
exports.logout = logout;
exports.logoutAll = logoutAll;
exports.getMe = getMe;
const crypto_1 = __importDefault(require("crypto"));
const user_model_1 = require("../models/user.model");
const refreshToken_model_1 = require("../models/refreshToken.model");
const jwt_util_1 = require("../utils/jwt.util");
const env_config_1 = require("../config/env.config");
const apiError_1 = require("../utils/apiError");
const apiResponse_1 = require("../utils/apiResponse");
const logger_1 = require("../utils/logger");
async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        if (!email || typeof email !== 'string' || !email.trim()) {
            throw apiError_1.ApiError.badRequest('Email is required', 'MISSING_EMAIL');
        }
        if (!password || typeof password !== 'string') {
            throw apiError_1.ApiError.badRequest('Password is required', 'MISSING_PASSWORD');
        }
        const normalizedEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            throw apiError_1.ApiError.badRequest('Invalid email format', 'INVALID_EMAIL_FORMAT');
        }
        const user = await user_model_1.User.findOne({ email: normalizedEmail }).select('+passwordHash');
        if (!user) {
            throw apiError_1.ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
        }
        if (!user.isActive) {
            throw apiError_1.ApiError.unauthorized('User account has been deactivated', 'ACCOUNT_DEACTIVATED');
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw apiError_1.ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
        }
        // Generate Access Token (JWT) & Refresh Token (Opaque)
        const accessToken = (0, jwt_util_1.generateAccessToken)(user);
        const refreshToken = (0, jwt_util_1.generateOpaqueRefreshToken)();
        const tokenHash = (0, jwt_util_1.hashToken)(refreshToken);
        const familyId = crypto_1.default.randomUUID();
        const expiresAt = new Date(Date.now() + (0, jwt_util_1.parseDurationToMs)(env_config_1.envConfig.refreshTokenExpiresIn));
        // Save refresh session in DB
        await refreshToken_model_1.RefreshToken.create({
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
        apiResponse_1.ApiResponse.success(res, 200, 'Login successful', {
            token: accessToken, // Backward compatibility
            accessToken,
            refreshToken,
            user: userPayload,
        });
    }
    catch (error) {
        next(error);
    }
}
async function refresh(req, res, next) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken || typeof refreshToken !== 'string') {
            throw apiError_1.ApiError.badRequest('Refresh token is required', 'MISSING_REFRESH_TOKEN');
        }
        const presentedTokenHash = (0, jwt_util_1.hashToken)(refreshToken);
        const tokenRecord = await refreshToken_model_1.RefreshToken.findOne({ tokenHash: presentedTokenHash });
        // REUSE DETECTION: If token exists but has already been revoked/rotated
        if (tokenRecord && tokenRecord.revokedAt) {
            logger_1.logger.warn(`[SECURITY WARNING] Refresh token reuse detected for family ${tokenRecord.familyId}. Revoking all sessions in token family.`);
            // Revoke all tokens belonging to this family
            await refreshToken_model_1.RefreshToken.updateMany({ familyId: tokenRecord.familyId, revokedAt: null }, { revokedAt: new Date() });
            throw apiError_1.ApiError.unauthorized('Invalid or revoked refresh token', 'INVALID_REFRESH_TOKEN');
        }
        // Validation
        if (!tokenRecord || tokenRecord.expiresAt.getTime() <= Date.now()) {
            throw apiError_1.ApiError.unauthorized('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
        }
        const user = await user_model_1.User.findById(tokenRecord.userId);
        if (!user || !user.isActive) {
            tokenRecord.revokedAt = new Date();
            await tokenRecord.save();
            throw apiError_1.ApiError.unauthorized('User account is inactive or missing', 'ACCOUNT_DEACTIVATED');
        }
        // ROTATION: Revoke old token and issue new token pair within the same familyId
        const newAccessToken = (0, jwt_util_1.generateAccessToken)(user);
        const newRefreshToken = (0, jwt_util_1.generateOpaqueRefreshToken)();
        const newTokenHash = (0, jwt_util_1.hashToken)(newRefreshToken);
        const newExpiresAt = new Date(Date.now() + (0, jwt_util_1.parseDurationToMs)(env_config_1.envConfig.refreshTokenExpiresIn));
        tokenRecord.revokedAt = new Date();
        tokenRecord.replacedByTokenHash = newTokenHash;
        await tokenRecord.save();
        await refreshToken_model_1.RefreshToken.create({
            userId: user._id,
            tokenHash: newTokenHash,
            familyId: tokenRecord.familyId,
            expiresAt: newExpiresAt,
            createdByIp: req.ip,
            userAgent: req.get('user-agent'),
        });
        apiResponse_1.ApiResponse.success(res, 200, 'Token refreshed successfully', {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    }
    catch (error) {
        next(error);
    }
}
async function logout(req, res, next) {
    try {
        const { refreshToken } = req.body;
        if (refreshToken && typeof refreshToken === 'string') {
            const presentedTokenHash = (0, jwt_util_1.hashToken)(refreshToken);
            await refreshToken_model_1.RefreshToken.findOneAndUpdate({ tokenHash: presentedTokenHash, revokedAt: null }, { revokedAt: new Date() });
        }
        apiResponse_1.ApiResponse.success(res, 200, 'Logged out successfully');
    }
    catch (error) {
        next(error);
    }
}
async function logoutAll(req, res, next) {
    try {
        if (!req.user || !req.user.id) {
            throw apiError_1.ApiError.unauthorized('Not authenticated', 'UNAUTHORIZED');
        }
        await refreshToken_model_1.RefreshToken.updateMany({ userId: req.user.id, revokedAt: null }, { revokedAt: new Date() });
        apiResponse_1.ApiResponse.success(res, 200, 'All sessions logged out successfully');
    }
    catch (error) {
        next(error);
    }
}
async function getMe(req, res, next) {
    try {
        if (!req.user) {
            throw apiError_1.ApiError.unauthorized('Not authenticated', 'UNAUTHORIZED');
        }
        apiResponse_1.ApiResponse.success(res, 200, 'User profile retrieved successfully', {
            user: req.user,
        });
    }
    catch (error) {
        next(error);
    }
}
