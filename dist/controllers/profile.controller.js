"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = getProfile;
exports.updateProfile = updateProfile;
exports.changePassword = changePassword;
const profile_service_1 = require("../services/profile.service");
const apiResponse_1 = require("../utils/apiResponse");
const apiError_1 = require("../utils/apiError");
async function getProfile(req, res, next) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw apiError_1.ApiError.unauthorized('Authentication token required.', 'UNAUTHORIZED');
        }
        const profile = await (0, profile_service_1.getUserProfile)(userId);
        apiResponse_1.ApiResponse.success(res, 200, 'Profile retrieved successfully', profile);
    }
    catch (error) {
        next(error);
    }
}
async function updateProfile(req, res, next) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw apiError_1.ApiError.unauthorized('Authentication token required.', 'UNAUTHORIZED');
        }
        const dto = {
            name: req.body.name,
            phone: req.body.phone,
        };
        const updatedProfile = await (0, profile_service_1.updateUserProfile)(userId, dto);
        apiResponse_1.ApiResponse.success(res, 200, 'Profile updated successfully', updatedProfile);
    }
    catch (error) {
        next(error);
    }
}
async function changePassword(req, res, next) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw apiError_1.ApiError.unauthorized('Authentication token required.', 'UNAUTHORIZED');
        }
        const { currentPassword, newPassword } = req.body;
        const result = await (0, profile_service_1.changeUserPassword)(userId, currentPassword, newPassword);
        apiResponse_1.ApiResponse.success(res, 200, result.message);
    }
    catch (error) {
        next(error);
    }
}
