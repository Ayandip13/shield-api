"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.getMe = getMe;
const user_model_1 = require("../models/user.model");
const jwt_util_1 = require("../utils/jwt.util");
const apiError_1 = require("../utils/apiError");
const apiResponse_1 = require("../utils/apiResponse");
async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        // Request input validation
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
        // Find active user with passwordHash
        const user = await user_model_1.User.findOne({ email: normalizedEmail }).select('+passwordHash');
        if (!user) {
            throw apiError_1.ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
        }
        if (!user.isActive) {
            throw apiError_1.ApiError.unauthorized('User account has been deactivated', 'ACCOUNT_DEACTIVATED');
        }
        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw apiError_1.ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
        }
        // Generate JWT token
        const token = (0, jwt_util_1.generateToken)({
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
        apiResponse_1.ApiResponse.success(res, 200, 'Login successful', {
            token,
            user: userPayload,
        });
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
