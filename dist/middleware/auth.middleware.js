"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const jwt_util_1 = require("../utils/jwt.util");
const user_model_1 = require("../models/user.model");
const apiError_1 = require("../utils/apiError");
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw apiError_1.ApiError.unauthorized('Authentication required. Missing or malformed token.', 'UNAUTHORIZED');
        }
        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = (0, jwt_util_1.verifyToken)(token);
        }
        catch (err) {
            throw apiError_1.ApiError.unauthorized('Invalid or expired authentication token.', 'INVALID_TOKEN');
        }
        const user = await user_model_1.User.findById(decoded.userId);
        if (!user || !user.isActive) {
            throw apiError_1.ApiError.unauthorized('User account not found or deactivated.', 'USER_INACTIVE');
        }
        req.user = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            providerId: user.providerId,
            buildingId: user.buildingId,
        };
        next();
    }
    catch (error) {
        next(error);
    }
}
